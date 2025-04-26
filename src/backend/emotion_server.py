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
from threading import Lock

# Configuração do lock para thread safety
emotion_lock = Lock()
app = FastAPI()

# Configuração CORS para o frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialização do MediaPipe para detecção facial
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(min_detection_confidence=0.5)
drawing = mp.solutions.drawing_utils

# Mapeamento de emoções para português (consistente com o frontend)
EMOTION_TRANSLATION = {
    "happy": "felicidade",
    "sad": "tristeza",
    "angry": "raiva",
    "fear": "estresse",
    "disgust": "nojo",
    "surprise": "surpresa",
    "neutral": "neutro"
}

# Cores para cada emoção (BGR para OpenCV, consistente com o frontend)
EMOTION_COLORS = {
    "felicidade": (0, 255, 0),       # Verde
    "tristeza": (255, 0, 0),         # Azul
    "raiva": (0, 0, 255),            # Vermelho
    "estresse": (255, 0, 255),       # Magenta
    "nojo": (0, 255, 255),           # Amarelo
    "surpresa": (255, 255, 0),       # Ciano
    "neutro": (200, 200, 200)        # Cinza
}

# Variáveis globais para análise contínua
emotion_counts = {
    "felicidade": 0,
    "tristeza": 0,
    "raiva": 0,
    "estresse": 0,
    "nojo": 0,
    "surpresa": 0,
    "neutro": 0
}
camera_thread = None
stop_camera = False
camera_active = False

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze-emotion/")
async def analyze_emotion(file: UploadFile = File(...)):
    try:
        # Ler a imagem enviada
        img_bytes = await file.read()
        img = Image.open(BytesIO(img_bytes))
        frame = np.array(img)

        # Converter para RGB (OpenCV usa BGR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detectar rostos
        results = face_detector.process(rgb_frame)
        emotions = {}

        if results.detections:
            for detection in results.detections:
                # Extrair coordenadas do rosto
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = frame.shape
                x, y, w_box, h_box = int(bbox.xmin * w), int(bbox.ymin * h), int(bbox.width * w), int(bbox.height * h)

                # Cortar a região do rosto
                if x >= 0 and y >= 0 and x + w_box <= w and y + h_box <= h:
                    face_region = frame[y:y + h_box, x:x + w_box]

                    try:
                        # Analisar emoções com DeepFace
                        analysis = DeepFace.analyze(face_region, actions=['emotion'], enforce_detection=False)

                        if isinstance(analysis, list):
                            emotion = analysis[0]['dominant_emotion']
                        else:
                            emotion = analysis['dominant_emotion']

                        # Traduzir para português
                        emotion_pt = EMOTION_TRANSLATION.get(emotion, emotion)
                        emotions[emotion_pt] = emotions.get(emotion_pt, 0) + 1

                    except Exception as e:
                        print(f"Erro na análise facial: {str(e)}")
        
        # Garantir que todas as emoções estejam presentes na resposta
        response = {e: emotions.get(e, 0) for e in EMOTION_TRANSLATION.values()}
        return response

    except Exception as e:
        print(f"Erro no endpoint /analyze-emotion: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Erro interno ao processar imagem: {str(e)}"}
        )

@app.post("/start-continuous-analysis/")
async def start_continuous_analysis():
    global camera_thread, stop_camera, camera_active, emotion_counts
    
    with emotion_lock:
        if camera_active:
            return {"message": "Análise contínua já está em andamento"}
        
        # Resetar contadores
        emotion_counts = {e: 0 for e in EMOTION_TRANSLATION.values()}
        
        stop_camera = False
        camera_active = True
        
        # Iniciar thread para captura contínua
        camera_thread = threading.Thread(target=continuous_analysis)
        camera_thread.daemon = True
        camera_thread.start()
        
        return {"message": "Análise contínua iniciada"}

@app.post("/stop-continuous-analysis/")
async def stop_continuous_analysis():
    global stop_camera, camera_active
    
    with emotion_lock:
        if not camera_active:
            return {"message": "Nenhuma análise contínua em andamento"}
        
        stop_camera = True
        camera_active = False
        
        # Copiar os dados atuais para retornar
        final_data = emotion_counts.copy()
        
        return {
            "message": "Análise contínua parada",
            "final_data": final_data
        }

@app.get("/get-emotion-data/")
async def get_emotion_data():
    with emotion_lock:
        return emotion_counts

def continuous_analysis():
    global stop_camera, emotion_counts
    
    cap = None
    try:
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # Configurações para melhor performance
        cap.set(cv2.CAP_PROP_FPS, 30)  # Tentar obter 30 FPS
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Buffer menor para menor latência
        
        while not stop_camera:
            # Limpar buffer para pegar o frame mais recente
            for _ in range(2):
                cap.grab()
            
            ret, frame = cap.read()
            if not ret:
                print("Falha ao capturar frame")
                time.sleep(0.01)
                continue
            
            # Processar cada frame sem pular
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_detector.process(rgb_frame)
            
            if results.detections:
                for detection in results.detections:
                    bbox = detection.location_data.relative_bounding_box
                    h, w, _ = frame.shape
                    x, y, w_box, h_box = int(bbox.xmin * w), int(bbox.ymin * h), int(bbox.width * w), int(bbox.height * h)
                    
                    if x >= 0 and y >= 0 and x + w_box <= w and y + h_box <= h:
                        face_region = frame[y:y + h_box, x:x + w_box]
                        
                        try:
                            # Usar apenas o modelo básico para melhor performance
                            analysis = DeepFace.analyze(
                                face_region, 
                                actions=['emotion'],
                                enforce_detection=False,
                                detector_backend='opencv'  # Mais rápido que o padrão
                            )
                            
                            if isinstance(analysis, list):
                                emotion = analysis[0]['dominant_emotion']
                            else:
                                emotion = analysis['dominant_emotion']
                            
                            emotion_pt = EMOTION_TRANSLATION.get(emotion, emotion)
                            
                            with emotion_lock:
                                emotion_counts[emotion_pt] += 1
                            
                        except Exception as e:
                            print(f"Erro na análise: {str(e)}")
            
            # Pequena pausa para não sobrecarregar
            time.sleep(0.01)
    
    except Exception as e:
        print(f"Erro na análise contínua: {str(e)}")
    
    finally:
        if cap and cap.isOpened():
            cap.release()
        print("Câmera liberada")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)