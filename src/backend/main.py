import base64
import uuid
import cv2
from deepface import DeepFace
from fastapi import FastAPI, File, HTTPException, Response, WebSocket, WebSocketDisconnect, status, Request, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
import numpy as np
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import hashlib
import httpx
import jwt
import secrets
import asyncio

# Carrega variáveis de ambiente

continuous_analysis_data = {}

load_dotenv()

app = FastAPI()

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_SECRET")
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

class EmotionAnalysisResult(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    face_detected: bool

class PasswordChangeRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str
    confirm_new_password: str

    @validator('new_password')
    def new_password_length(cls, v):
        if len(v) < 6:
            raise ValueError("A nova senha deve ter pelo menos 6 caracteres")
        return v

    @validator('confirm_new_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError("As novas senhas não coincidem")
        return v


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, data: dict, websocket: WebSocket):
        try:
            await websocket.send_json(data)
        except Exception as e:
            print(f"Erro ao enviar mensagem: {e}")
            self.disconnect(websocket)

manager = ConnectionManager()

# Função para análise de emoções em uma imagem
async def analyze_emotions(image_data: bytes) -> Dict:
    await asyncio.sleep(0.1)  # Delay de 100ms
    try:
        # Converter bytes para numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        
        # Decodificar a imagem
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "emotions": {},
                "dominant_emotion": "none",
                "face_detected": False
            }
        
        # Converter BGR para RGB (que o DeepFace espera)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Analisar emoções - forma correta de chamar o DeepFace
        result = DeepFace.analyze(
            img_path=img_rgb, 
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv',
            silent=True
        )
        
        # Se múltiplos rostos, pegar o primeiro
        if isinstance(result, list):
            result = result[0]
        
        return {
            "emotions": result["emotion"],
            "dominant_emotion": result["dominant_emotion"],
            "face_detected": True
        }
        
    except Exception as e:
        print(f"Erro na análise: {str(e)}")
        return {
            "emotions": {},
            "dominant_emotion": "none",
            "face_detected": False
        }

@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = await analyze_emotions(contents)
        
        if not result["face_detected"]:
            raise HTTPException(
                status_code=400,
                detail="Nenhum rosto detectado na imagem"
            )
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar imagem: {str(e)}"
        )
    
# Rota WebSocket para análise contínua
@app.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_bytes(), timeout=10.0)
                # Receber imagem como blob
                image_data = await websocket.receive_bytes()
                
                # Converter para formato OpenCV
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Não foi possível decodificar a imagem"
                    })
                    continue

                # Analisar emoções
                try:
                    results = DeepFace.analyze(
                        img_path=img,
                        actions=['emotion'],
                        enforce_detection=False,
                        detector_backend='opencv',
                        silent=True
                    )
                    
                    if isinstance(results, list):
                        result = results[0]
                    else:
                        result = results

                    await websocket.send_json({
                        "type": "analysis_result",
                        "data": {
                            "emotions": result['emotion'],
                            "dominant_emotion": result['dominant_emotion'],
                            "timestamp": datetime.now().isoformat()
                        }
                    })
                    
                except Exception as analysis_error:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Erro na análise: {str(analysis_error)}"
                    })
            except asyncio.TimeoutError:
                # Envia ping para verificar se a conexão está ativa
                try:
                    await websocket.send_json({"type": "ping"})
                    continue
                except:
                    break

            except Exception as recv_error:
                if isinstance(recv_error, WebSocketDisconnect):
                    print("Cliente desconectado normalmente")
                else:
                    print(f"Erro ao receber dados: {str(recv_error)}")
                break

    except Exception as e:
        print(f"Erro na conexão WebSocket: {str(e)}")
    finally:
        try:
            await websocket.close(code=1000)
        except:
            pass
        print("Conexão WebSocket finalizada")

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirmPassword: str

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Nome é obrigatório')
        return v.strip()

    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('A senha deve ter pelo menos 6 caracteres')
        return v

    @validator('confirmPassword')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('As senhas não coincidem')
        return v

class OAuthUser(BaseModel):
    email: EmailStr
    name: str
    provider: str
    provider_id: str
    picture: Optional[str] = None

def generate_image_hash(file: UploadFile) -> str:
    content = file.file.read()
    file.file.seek(0)  # Reset para reutilizar o conteúdo depois
    return hashlib.md5(content).hexdigest()    

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print("Erro ao conectar ao banco de dados:", e)
        raise

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_data: Dict[str, Any]) -> str:
    expiration = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": str(user_data["id"]),
        "email": user_data["email"],
        "name": user_data["name"],
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def find_or_create_oauth_user(user_data: OAuthUser):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verifica se o usuário já existe pelo provider_id
        cur.execute(
            """
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN oauth_providers op ON u.id = op.user_id
            WHERE op.provider = %s AND op.provider_id = %s
            """,
            (user_data.provider, user_data.provider_id)
        )
        existing_user = cur.fetchone()
        
        if existing_user:
            return existing_user
        
        # Verifica se o email já está cadastrado (mesmo com outro provider)
        cur.execute("SELECT id, name, email FROM users WHERE email = %s", (user_data.email,))
        email_user = cur.fetchone()
        
        if email_user:
            user_id = email_user['id']
        else:
            # Cria novo usuário
            cur.execute(
                """
                INSERT INTO users (name, email, created_at, updated_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, email
                """,
                (user_data.name, user_data.email, datetime.now(), datetime.now())
            )
            new_user = cur.fetchone()
            user_id = new_user['id']
        
        # Vincula o provider ao usuário
        cur.execute(
            """
            INSERT INTO oauth_providers (user_id, provider, provider_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (provider, provider_id) DO NOTHING
            """,
            (user_id, user_data.provider, user_data.provider_id)
        )
        
        conn.commit()
        
        # Retorna os dados do usuário
        cur.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()
        
    except Exception as e:
        print("Erro ao criar/recuperar usuário OAuth:", e)
        raise
    finally:
        if conn is not None:
            conn.close()

@app.post("/login/")
async def login_user(user: UserLogin):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email não cadastrado"
            )
        
        hashed_password = hash_password(user.password)
        if db_user['password_hash'] != hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais Inválidas"
            )
        
        token = create_jwt_token(db_user)
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": db_user['id'],
                "name": db_user['name'],
                "email": db_user['email']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print("Erro durante o login:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro durante o login"
        )
    finally:
        if conn is not None:
            conn.close()

@app.post("/register/", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        hashed_password = hash_password(user.password)
        
        cur.execute(
            """
            INSERT INTO users (name, email, password_hash, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, email, created_at
            """,
            (user.name, user.email, hashed_password, datetime.now(), datetime.now())
        )
        
        new_user = cur.fetchone()
        conn.commit()
        
        token = create_jwt_token(new_user)
        
        return {
            "message": "Usuário cadastrado com sucesso!",
            "token": token,
            "user": new_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print("Erro durante o registro:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro durante o registro"
        )
    finally:
        if conn is not None:
            conn.close()

@app.post("/generate-reset-token/")
async def generate_reset_token(request: dict):
    token = secrets.token_urlsafe(32)  # Certifique-se que está gerando um token válido
    expires_at = datetime.now() + timedelta(hours=1)  # Verifique o horário do servidor
    conn = None
    try:
        email = request.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email é obrigatório")

        conn = get_db_connection()
        cur = conn.cursor()

        # Verifica se o usuário existe
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Email não cadastrado")

        # Remove tokens existentes para este usuário
        cur.execute(
            "DELETE FROM password_reset_tokens WHERE user_id = %s",
            (user['id'],)
        )

        # Gera novo token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=1)

        # Armazena no banco
        cur.execute(
            """
            INSERT INTO password_reset_tokens (token, user_id, email, expires_at)
            VALUES (%s, %s, %s, %s)
            """,
            (token, user['id'], email, expires_at)
        )
        conn.commit()

        return {"token": token, "expires_at": expires_at.isoformat()}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@app.post("/validate-reset-token/")
async def validate_reset_token(request: dict):
    conn = None
    try:
        token = request.get("token")
        email = request.get("email")
        
        if not token or not email:
            return {"valid": False, "message": "Token e email são obrigatórios"}
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verifique se o token existe e está associado ao email
        cur.execute(
            """
            SELECT prt.user_id, prt.email, prt.expires_at, u.email as user_email
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token = %s AND prt.email = %s AND u.email = %s
            """, 
            (token, email, email)
        )
        result = cur.fetchone()
        
        if not result:
            return {"valid": False, "message": "Token inválido ou não associado ao email"}
            
        if datetime.now() > result['expires_at']:
            return {"valid": False, "message": "Token expirado"}
        
        return {"valid": True, "email": result['email']}
        
    except Exception as e:
        print(f"Erro ao validar token: {str(e)}")
        return {"valid": False, "message": "Erro interno ao validar token"}
    finally:
        if conn:
            conn.close()

@app.post("/reset-password/")
async def reset_password(request: dict):
    conn = None
    try:
        token = request.get("token")
        email = request.get("email")
        new_password = request.get("new_password")

        if not all([token, email, new_password]):
            raise HTTPException(status_code=400, detail="Todos os campos são obrigatórios")

        conn = get_db_connection()
        cur = conn.cursor()

        # Verifica se o token é válido
        cur.execute(
            """SELECT user_id, expires_at FROM password_reset_tokens 
               WHERE token = %s AND email = %s""",
            (token, email)
        )
        token_data = cur.fetchone()

        if not token_data:
            raise HTTPException(status_code=404, detail="Token inválido")

        if datetime.now() > token_data['expires_at']:
            raise HTTPException(status_code=400, detail="Token expirado")

        # Atualiza a senha do usuário
        hashed_password = hash_password(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (hashed_password, token_data['user_id'])
        )

        # Remove o token usado
        cur.execute(
            "DELETE FROM password_reset_tokens WHERE token = %s",
            (token,)
        )

        conn.commit()

        return {"message": "Senha atualizada com sucesso"}

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/auth/google")
async def login_google():
    # Adiciona estado para proteção CSRF
    state = secrets.token_urlsafe(16)
    response = RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={NEXT_PUBLIC_GOOGLE_CLIENT_ID}&"
        f"redirect_uri={BASE_URL}/auth/google/callback&"
        f"response_type=code&"
        f"scope=openid%20profile%20email&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={state}"
    )
    # Armazena o estado em um cookie seguro para validação posterior
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600  # 10 minutos é suficiente para o fluxo de login
    )
    return response

@app.get("/auth/google/callback")
async def google_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    try:
        # Verifica o estado para proteção CSRF
        client_state = request.cookies.get("oauth_state")
        if not client_state or client_state != state:
            return RedirectResponse(
                url=f"{BASE_URL}/login/error?message=Falha na verificação de segurança"
            )
        
        # Limpa o cookie de estado
        response = Response()
        response.delete_cookie("oauth_state")
        
        # Trocar código por token
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            "client_secret": NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{BASE_URL}/auth/google/callback",
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            # 1. Obter tokens de acesso
            token_response = await client.post(token_url, data=data)
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # 2. Obter informações do usuário
            userinfo = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            userinfo.raise_for_status()
            user_data = userinfo.json()
            
            # 3. Criar ou recuperar usuário
            oauth_user = OAuthUser(
                email=user_data["email"],
                name=user_data.get("name", user_data["email"].split('@')[0]),
                provider="google",
                provider_id=user_data["sub"],
                picture=user_data.get("picture")
            )
            
            user = await find_or_create_oauth_user(oauth_user)
            
            # 4. Criar token JWT
            token = create_jwt_token(user)
            
            # 5. Redirecionar para a home com o token no cookie
            response = RedirectResponse(url=f"{BASE_URL}/")
            response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=3600  # 1 hora de expiração
            )
            return response
            
    except httpx.HTTPStatusError as e:
        print(f"Erro na autenticação com Google: {e.response.text}")
        return RedirectResponse(
            url=f"{BASE_URL}/login/error?message=Falha na autenticação com Google"
        )
    except Exception as e:
        print(f"Erro inesperado na autenticação com Google: {str(e)}")
        return RedirectResponse(
            url=f"{BASE_URL}/login/error?message=Erro inesperado"
        )
    
@app.post("/auth/google")
async def handle_google_auth(request: Request):
    data = await request.json()
    code = data.get("code")
    state = data.get("state")
    
    try:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            "client_secret": NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{BASE_URL}/auth/google/callback",  # Use a mesma redirect_uri
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            # 1. Troque o código por um token de acesso
            token_response = await client.post(token_url, data=data)
            tokens = token_response.json()
            
            # 2. Obtenha os dados do usuário
            userinfo = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            user_data = userinfo.json()
            
            # 3. Crie ou recupere o usuário no seu banco de dados
            oauth_user = OAuthUser(
                email=user_data["email"],
                name=user_data.get("name", user_data["email"].split('@')[0]),
                provider="google",
                provider_id=user_data["sub"],
                picture=user_data.get("picture")
            )
            user = await find_or_create_oauth_user(oauth_user)
            
            # 4. Gere um token JWT para o usuário
            token = create_jwt_token(user)
            
            return {
                "success": True,
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
    
    except Exception as e:
        print(f"Erro no auth Google (POST): {str(e)}")
        return JSONResponse(
            {"success": False, "error": "Falha na autenticação"},
            status_code=400
        )

@app.get("/auth/me")
async def get_current_user(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido"
        )
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user": payload}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

@app.get("/users/")
async def list_users():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
        users = cur.fetchall()
        
        return {"users": users}
        
    except Exception as e:
        print("Erro ao listar usuários:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro ao listar usuários"
        )
    finally:
        if conn is not None:
            conn.close()

    
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)