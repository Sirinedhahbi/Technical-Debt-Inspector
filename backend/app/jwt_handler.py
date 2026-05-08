# backend/app/jwt_handler.py

from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_secret_in_production")
ALGORITHM  = "HS256"
EXPIRE_HOURS = 24   #mananssouch fazet el refresh token !!!

def create_token(id_user: int, email: str) -> str:

    payload = {
        "id_user": id_user,
        "email":   email,
        "exp":     datetime.utcnow() + timedelta(hours=EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None