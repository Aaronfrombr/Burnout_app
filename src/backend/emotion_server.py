from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
from deepface import DeepFace
from io import BytesIO
import numpy as np
from PIL import Image
import asyncio
import threading
import time
import json
from fastapi.responses import JSONResponse

app = FastAPI()

# Liberar acesso para o Next.js rodando no localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar OpenCV e MediaPipe
solucao_reconhecimento_rosto = mp.solutions.face_detection
reconhecedor_rostos = solucao_reconhecimento_rosto.FaceDetection(min_detection_confidence=0.5)
desenho = mp.solutions.drawing_utils

# Mapeamento de emoções para português
traducao_emocoes = {
    "happy": "felicidade",
    "sad": "tristeza",
    "angry": "raiva",
    "fear": "estresse",  # Mapeando fear para estresse no dashboard
    "disgust": "nojo",
    "surprise": "surpresa",
    "neutral": "neutro"
}

# Cores para cada emoção (formato BGR para OpenCV)
cores_emocoes = {
    "happy": (0, 255, 0),       # Verde
    "sad": (255, 0, 0),         # Azul
    "angry": (0, 0, 255),       # Vermelho
    "fear": (255, 0, 255),      # Magenta
    "disgust": (0, 255, 255),   # Amarelo
    "surprise": (255, 255, 0),  # Ciano
    "neutral": (200, 200, 200)  # Cinza
}

# Variáveis globais para o modo contínuo
emotion_counts = {}  # Contador global de emoções
camera_thread = None
stop_camera = False
camera_active = False

@app.post("/analyze-emotion/")
async def analyze_emotion(file: UploadFile = File(...)):
    # Receber a imagem enviada
    img_bytes = await file.read()
    img = Image.open(BytesIO(img_bytes))
    frame = np.array(img)

    # Converter para RGB (o OpenCV usa BGR)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detectar rostos
    resultados = reconhecedor_rostos.process(rgb_frame)
    emotions = {}

    if resultados.detections:
        for rosto in resultados.detections:
            # Extrair coordenadas do rosto detectado
            bboxC = rosto.location_data.relative_bounding_box
            h, w, _ = frame.shape
            x, y, w_box, h_box = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)

            # Cortar a região do rosto
            if x >= 0 and y >= 0 and x + w_box <= w and y + h_box <= h:
                rosto_cortado = frame[y:y + h_box, x:x + w_box]

                try:
                    # Usar DeepFace para detectar emoções
                    analise = DeepFace.analyze(rosto_cortado, actions=['emotion'], enforce_detection=False)

                    if isinstance(analise, list):
                        emocao = analise[0]['dominant_emotion']
                    else:
                        emocao = analise['dominant_emotion']

                    # Traduzir emoção para português
                    emocao_pt = traducao_emocoes.get(emocao, emocao)
                    emotions[emocao_pt] = emotions.get(emocao_pt, 0) + 1

                except Exception as e:
                    print(f"Erro ao analisar o rosto: {str(e)}")

    return emotions

@app.post("/start-continuous-analysis/")
async def start_continuous_analysis():
    global camera_thread, stop_camera, camera_active, emotion_counts
    
    # Reiniciar o contador de emoções
    emotion_counts = {}
    
    if camera_active:
        return {"message": "Análise contínua já está em andamento"}
    
    stop_camera = False
    camera_active = True
    
    # Iniciar thread para captura e análise contínua
    camera_thread = threading.Thread(target=continuous_analysis)
    camera_thread.daemon = True  # Para que a thread termine quando o programa principal terminar
    camera_thread.start()
    
    return {"message": "Análise contínua iniciada"}

@app.post("/stop-continuous-analysis/")
async def stop_continuous_analysis():
    global stop_camera, camera_active
    
    if not camera_active:
        return {"message": "Nenhuma análise contínua em andamento"}
    
    stop_camera = True
    camera_active = False
    
    # Aguardar a thread terminar
    if camera_thread:
        camera_thread.join(timeout=1.0)
    
    return {"message": "Análise contínua parada"}

@app.get("/get-emotion-data/")
async def get_emotion_data():
    global emotion_counts
    return emotion_counts

def continuous_analysis():
    global stop_camera, emotion_counts
    
    # Inicializar a webcam
    webcam = cv2.VideoCapture(0)
    webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    # Configuração para análise
    frame_count = 0
    analyze_every = 5  # Analisar a cada 5 frames
    
    try:
        while not stop_camera:
            # Ler frame da webcam
            success, frame = webcam.read()
            if not success:
                break
            
            frame_count += 1
            
            # Analisar a cada X frames para melhor desempenho
            if frame_count % analyze_every == 0:
                # Converter para RGB para o MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Detectar rostos
                resultados = reconhecedor_rostos.process(rgb_frame)
                
                if resultados.detections:
                    for rosto in resultados.detections:
                        # Extrair coordenadas do rosto
                        bboxC = rosto.location_data.relative_bounding_box
                        h, w, _ = frame.shape
                        x, y, w_box, h_box = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
                        
                        # Verificar se as coordenadas estão dentro do frame
                        if x >= 0 and y >= 0 and x + w_box <= w and y + h_box <= h:
                            rosto_cortado = frame[y:y + h_box, x:x + w_box]
                            
                            try:
                                # Analisar emoções
                                analise = DeepFace.analyze(rosto_cortado, actions=['emotion'], enforce_detection=False)
                                
                                if isinstance(analise, list):
                                    emocao = analise[0]['dominant_emotion']
                                else:
                                    emocao = analise['dominant_emotion']
                                
                                # Traduzir e incrementar contador
                                emocao_pt = traducao_emocoes.get(emocao, emocao)
                                emotion_counts[emocao_pt] = emotion_counts.get(emocao_pt, 0) + 1
                                
                            except Exception as e:
                                print(f"Erro na análise de emoções: {str(e)}")
            
            # Pequena pausa para não sobrecarregar o CPU
            time.sleep(0.1)
    
    finally:
        # Liberar recursos
        webcam.release()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)