# src/backend/main.py
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from datetime import datetime
import hashlib

# Carrega variáveis de ambiente
load_dotenv()

app = FastAPI()

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Ajuste para o domínio do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo Pydantic para validação
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

# Configuração do banco de dados
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

# Função para criar hash da senha
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Rota de registro
@app.post("/register/", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    conn = None
    try:
        # Verifica se o usuário já existe
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        # Hash da senha
        hashed_password = hash_password(user.password)
        
        # Insere o novo usuário
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
        
        return {
            "message": "Usuário cadastrado com sucesso!",
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

# Rota de saúde
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

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