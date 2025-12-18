# -*- coding: utf-8 -*-
"""
API para Configuración de IA (Claude API, OpenAI, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import httpx
import json

from app.db.database import get_db
from app.models.user import User
from app.models.ai_config import AIConfig, AIUsageLog
from app.core.security import get_current_user

router = APIRouter(prefix="/api/ai-config", tags=["AI Configuration"])


# Schemas
class AIConfigCreate(BaseModel):
    provider: str = Field(..., description="Proveedor de IA (anthropic, openai)")
    api_key: str = Field(..., description="API Key del proveedor")
    model: str = Field(..., description="Modelo a usar")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=100000)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    system_prompt: Optional[str] = None


class AIConfigUpdate(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=100000)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    system_prompt: Optional[str] = None


class AIConfigResponse(BaseModel):
    id: int
    provider: str
    model: str
    temperature: float
    max_tokens: int
    top_p: float
    system_prompt: Optional[str]
    is_active: bool
    is_valid: bool
    api_key_preview: str  # Solo los primeros y últimos caracteres
    last_used_at: Optional[datetime]
    usage_count: int
    created_at: datetime


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []


class ChatResponse(BaseModel):
    response: str
    tokens_used: Optional[int] = None
    model: str
    provider: str


def mask_api_key(api_key: str) -> str:
    """Ocultar la API key mostrando solo inicio y final"""
    if len(api_key) <= 8:
        return "***"
    return f"{api_key[:4]}...{api_key[-4:]}"


async def validate_anthropic_api_key(api_key: str) -> bool:
    """Validar API key de Anthropic (Claude)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",  # Modelo más económico para validación
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "test"}],
                },
                timeout=10.0,
            )
            return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error validando API key de Anthropic: {e}")
        return False


async def validate_openai_api_key(api_key: str) -> bool:
    """Validar API key de OpenAI"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0,
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Error validando API key de OpenAI: {e}")
        return False


@router.post("/", response_model=AIConfigResponse)
async def create_ai_config(
    config: AIConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear o actualizar configuración de IA"""

    # Validar API key
    is_valid = False
    if config.provider == "anthropic":
        is_valid = await validate_anthropic_api_key(config.api_key)
    elif config.provider == "openai":
        is_valid = await validate_openai_api_key(config.api_key)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proveedor no soportado: {config.provider}. Usa 'anthropic' u 'openai'.",
        )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La API key no es válida o no tiene permisos.",
        )

    # Verificar si ya existe configuración para este cliente
    existing_config = (
        db.query(AIConfig)
        .filter(
            AIConfig.client_id == current_user.client_id,
            AIConfig.provider == config.provider,
        )
        .first()
    )

    if existing_config:
        # Actualizar configuración existente
        existing_config.api_key = config.api_key
        existing_config.model = config.model
        existing_config.temperature = config.temperature
        existing_config.max_tokens = config.max_tokens
        existing_config.top_p = config.top_p
        existing_config.system_prompt = config.system_prompt
        existing_config.is_valid = is_valid
        existing_config.updated_at = datetime.now()

        ai_config = existing_config
    else:
        # Crear nueva configuración
        ai_config = AIConfig(
            provider=config.provider,
            api_key=config.api_key,
            model=config.model,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            top_p=config.top_p,
            system_prompt=config.system_prompt,
            is_valid=is_valid,
            client_id=current_user.client_id,
            created_by=current_user.id,
        )
        db.add(ai_config)

    db.commit()
    db.refresh(ai_config)

    return AIConfigResponse(
        id=ai_config.id,
        provider=ai_config.provider,
        model=ai_config.model,
        temperature=ai_config.temperature,
        max_tokens=ai_config.max_tokens,
        top_p=ai_config.top_p,
        system_prompt=ai_config.system_prompt,
        is_active=ai_config.is_active,
        is_valid=ai_config.is_valid,
        api_key_preview=mask_api_key(ai_config.api_key),
        last_used_at=ai_config.last_used_at,
        usage_count=ai_config.usage_count,
        created_at=ai_config.created_at,
    )


@router.get("/", response_model=AIConfigResponse)
async def get_ai_config(
    provider: str = "anthropic",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener configuración de IA actual"""

    ai_config = (
        db.query(AIConfig)
        .filter(
            AIConfig.client_id == current_user.client_id,
            AIConfig.provider == provider,
            AIConfig.is_active == True,
        )
        .first()
    )

    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay configuración de IA para este proveedor",
        )

    return AIConfigResponse(
        id=ai_config.id,
        provider=ai_config.provider,
        model=ai_config.model,
        temperature=ai_config.temperature,
        max_tokens=ai_config.max_tokens,
        top_p=ai_config.top_p,
        system_prompt=ai_config.system_prompt,
        is_active=ai_config.is_active,
        is_valid=ai_config.is_valid,
        api_key_preview=mask_api_key(ai_config.api_key),
        last_used_at=ai_config.last_used_at,
        usage_count=ai_config.usage_count,
        created_at=ai_config.created_at,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enviar mensaje a la IA y obtener respuesta"""

    # Obtener configuración activa (por defecto Anthropic)
    ai_config = (
        db.query(AIConfig)
        .filter(
            AIConfig.client_id == current_user.client_id,
            AIConfig.is_active == True,
            AIConfig.is_valid == True,
        )
        .first()
    )

    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay configuración de IA válida. Por favor, configura tu API key primero.",
        )

    start_time = datetime.now()
    response_text = ""
    tokens_used = 0
    error_message = None

    try:
        if ai_config.provider == "anthropic":
            # Llamar a Claude API
            async with httpx.AsyncClient() as client:
                messages = request.conversation_history + [
                    {"role": "user", "content": request.message}
                ]

                payload = {
                    "model": ai_config.model,
                    "max_tokens": ai_config.max_tokens,
                    "temperature": ai_config.temperature,
                    "messages": messages,
                }

                if ai_config.system_prompt:
                    payload["system"] = ai_config.system_prompt

                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ai_config.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json=payload,
                    timeout=60.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    response_text = data["content"][0]["text"]
                    tokens_used = data["usage"]["input_tokens"] + data["usage"]["output_tokens"]
                else:
                    error_message = f"Error API: {response.status_code} - {response.text}"
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=error_message,
                    )

        elif ai_config.provider == "openai":
            # Llamar a OpenAI API
            async with httpx.AsyncClient() as client:
                messages = request.conversation_history + [
                    {"role": "user", "content": request.message}
                ]

                if ai_config.system_prompt:
                    messages.insert(0, {"role": "system", "content": ai_config.system_prompt})

                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {ai_config.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": ai_config.model,
                        "messages": messages,
                        "temperature": ai_config.temperature,
                        "max_tokens": ai_config.max_tokens,
                        "top_p": ai_config.top_p,
                    },
                    timeout=60.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    response_text = data["choices"][0]["message"]["content"]
                    tokens_used = data["usage"]["total_tokens"]
                else:
                    error_message = f"Error API: {response.status_code} - {response.text}"
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=error_message,
                    )

        # Registrar uso
        duration = (datetime.now() - start_time).total_seconds()

        usage_log = AIUsageLog(
            ai_config_id=ai_config.id,
            user_id=current_user.id,
            prompt=request.message,
            response=response_text,
            total_tokens=tokens_used,
            duration_seconds=duration,
            status="success",
        )
        db.add(usage_log)

        # Actualizar contador de uso
        ai_config.usage_count += 1
        ai_config.last_used_at = datetime.now()

        db.commit()

        return ChatResponse(
            response=response_text,
            tokens_used=tokens_used,
            model=ai_config.model,
            provider=ai_config.provider,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        duration = (datetime.now() - start_time).total_seconds()

        # Registrar error
        usage_log = AIUsageLog(
            ai_config_id=ai_config.id,
            user_id=current_user.id,
            prompt=request.message,
            duration_seconds=duration,
            status="error",
            error_message=error_message,
        )
        db.add(usage_log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al comunicarse con la IA: {error_message}",
        )


@router.delete("/")
async def delete_ai_config(
    provider: str = "anthropic",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar configuración de IA"""

    ai_config = (
        db.query(AIConfig)
        .filter(
            AIConfig.client_id == current_user.client_id,
            AIConfig.provider == provider,
        )
        .first()
    )

    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración no encontrada",
        )

    db.delete(ai_config)
    db.commit()

    return {"message": "Configuración de IA eliminada exitosamente"}


@router.get("/usage-stats")
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener estadísticas de uso de la IA"""

    ai_config = (
        db.query(AIConfig)
        .filter(
            AIConfig.client_id == current_user.client_id,
            AIConfig.is_active == True,
        )
        .first()
    )

    if not ai_config:
        return {"total_requests": 0, "total_tokens": 0, "last_used": None}

    logs = (
        db.query(AIUsageLog)
        .filter(AIUsageLog.ai_config_id == ai_config.id)
        .all()
    )

    total_tokens = sum(log.total_tokens or 0 for log in logs)
    total_requests = len(logs)

    return {
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "usage_count": ai_config.usage_count,
        "last_used": ai_config.last_used_at,
    }
