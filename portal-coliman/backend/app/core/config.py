from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os

class Settings(BaseSettings):
    # Información de la aplicación
    APP_NAME: str = "Portal AgentSat"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Portal de validación CFDI para clientes"

    # Base de datos
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://agentsat_user:AgentSat2025!@localhost:3306/agentsat_portal"
    )

    # Seguridad JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "tu_clave_secreta_muy_segura_cambiame_en_produccion_2025"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    # Configuración de archivos
    UPLOAD_FOLDER: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
