from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
from deepface import DeepFace
from io import BytesIO
import numpy as np
from PIL import Image

app = FastAPI()

# Liberar acesso para o Next.js rodando no localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Inicializar OpenCV e MediaPipe
solucao_reconhecimento_rosto = mp.solutions.face_detection
reconhecedor_rostos = solucao_reconhecimento_rosto.FaceDetection(min_detection_confidence=0.5)
desenho = mp.solutions.drawing_utils

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

                    emotions[emocao] = emotions.get(emocao, 0) + 1  # Contar emoções detectadas

                except Exception as e:
                    print(f"Erro ao analisar o rosto: {str(e)}")

    # Tradução de emoções para português
    traducao = {
        "happy": "felicidade",
        "sad": "tristeza",
        "angry": "raiva",
        "fear": "estresse",  # Mapeando fear para estresse
        "disgust": "nojo",
        "surprise": "surpresa",
        "neutral": "neutro"
    }
    
    emotions_traduzidas = {}
    for emocao, contagem in emotions.items():
        emotions_traduzidas[traducao.get(emocao, emocao)] = contagem
    
    return emotions_traduzidas