# -*- coding: utf-8 -*-
"""
Modelo de Base de Datos para Configuración de IA
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class AIConfig(Base):
    """Configuración de IA para el portal"""
    __tablename__ = "ai_configs"

    id = Column(Integer, primary_key=True, index=True)

    # Proveedor de IA
    provider = Column(String(50), nullable=False, default="anthropic")  # anthropic, openai, etc.

    # API Key (cifrada)
    api_key = Column(Text, nullable=False)

    # Modelo seleccionado
    model = Column(String(100), nullable=False, default="claude-3-5-sonnet-20241022")

    # Parámetros de configuración
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    top_p = Column(Float, default=1.0)

    # Configuración adicional (JSON string)
    system_prompt = Column(Text, nullable=True)

    # Estado
    is_active = Column(Boolean, default=True)
    is_valid = Column(Boolean, default=False)  # Si la API key fue validada

    # Relación con cliente
    client_id = Column(String(50), nullable=False, index=True)

    # Auditoría
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Último uso
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    usage_count = Column(Integer, default=0)


class AIUsageLog(Base):
    """Log de uso de la IA"""
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Referencia a la configuración usada
    ai_config_id = Column(Integer, ForeignKey("ai_configs.id"), nullable=False)

    # Usuario que hizo la consulta
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Detalles de la consulta
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)

    # Tokens usados
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)

    # Costo estimado (en USD)
    estimated_cost = Column(Float, nullable=True)

    # Duración (en segundos)
    duration_seconds = Column(Float, nullable=True)

    # Estado
    status = Column(String(20), default="success")  # success, error
    error_message = Column(Text, nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
