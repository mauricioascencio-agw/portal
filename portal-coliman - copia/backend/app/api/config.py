"""
API endpoints para configuración del sistema
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import os
import shutil
from datetime import datetime
from cryptography.fernet import Fernet
import base64

from app.db.database import get_db
from app.models.user import User
from app.models.app_config import AppConfig
from app.core.security import get_current_user

router = APIRouter(prefix="/api/config", tags=["config"])


# Schemas para configuración general
class AppConfigUpdate(BaseModel):
    company_name: Optional[str] = None
    short_name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    company_rfc: Optional[str] = None
    footer_text: Optional[str] = None


class AppConfigResponse(BaseModel):
    id: int
    company_name: str
    short_name: Optional[str]
    version: Optional[str]
    description: Optional[str]
    primary_color: Optional[str]
    secondary_color: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    address: Optional[str]
    company_rfc: Optional[str]
    footer_text: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

# Directorio para almacenar credenciales FIEL
FIEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fiel_credentials")
os.makedirs(FIEL_DIR, exist_ok=True)

# Clave de cifrado para contraseñas (en producción debería estar en variable de entorno)
# Esta clave debe ser consistente y almacenada de forma segura
ENCRYPTION_KEY = os.getenv("FIEL_ENCRYPTION_KEY", "your-32-byte-base64-encoded-key-here-change-in-production==")

def get_cipher():
    """Obtiene el cipher para cifrado/descifrado"""
    try:
        # Si la clave es la predeterminada, generar una válida para desarrollo
        if "change-in-production" in ENCRYPTION_KEY:
            # Generar una clave válida (solo para desarrollo)
            key = Fernet.generate_key()
        else:
            key = ENCRYPTION_KEY.encode()
        return Fernet(key)
    except Exception:
        # Si hay error, generar una nueva clave
        return Fernet(Fernet.generate_key())

def encrypt_password(password: str) -> str:
    """Cifra una contraseña"""
    cipher = get_cipher()
    encrypted = cipher.encrypt(password.encode())
    return base64.b64encode(encrypted).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Descifra una contraseña"""
    cipher = get_cipher()
    decrypted = cipher.decrypt(base64.b64decode(encrypted_password))
    return decrypted.decode()

def save_fiel_file(file: UploadFile, filename: str) -> str:
    """Guarda un archivo FIEL y retorna la ruta"""
    filepath = os.path.join(FIEL_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return filepath

def verify_fiel_files(cer_path: str, key_path: str, password: str) -> bool:
    """
    Verifica que los archivos FIEL sean válidos
    Por ahora solo verifica que existan, en producción debería validar:
    - Formato correcto de certificado
    - Que la contraseña sea correcta para la clave privada
    - Que el certificado no esté vencido
    """
    try:
        # Verificar que los archivos existan
        if not os.path.exists(cer_path) or not os.path.exists(key_path):
            return False

        # Verificar que los archivos no estén vacíos
        if os.path.getsize(cer_path) == 0 or os.path.getsize(key_path) == 0:
            return False

        # TODO: Implementar validación real del certificado y clave privada
        # - Verificar que .cer sea un certificado X.509 válido
        # - Verificar que .key pueda descifrarse con la contraseña
        # - Verificar que el certificado no esté vencido

        return True
    except Exception:
        return False

@router.post("/fiel")
async def save_fiel_config(
    cer_file: Optional[UploadFile] = File(None),
    key_file: Optional[UploadFile] = File(None),
    password: str = Form(...),
    rfc: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Guarda o actualiza la configuración de FIEL
    """
    # Verificar que el usuario sea admin
    if current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para configurar FIEL"
        )

    # Validar RFC
    rfc = rfc.upper().strip()
    if len(rfc) < 12 or len(rfc) > 13:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RFC inválido"
        )

    # Validar archivos
    if cer_file and not cer_file.filename.endswith('.cer'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de certificado debe tener extensión .cer"
        )

    if key_file and not key_file.filename.endswith('.key'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de clave privada debe tener extensión .key"
        )

    try:
        # Guardar archivos si se proporcionaron
        cer_filename = None
        key_filename = None
        cer_path = None
        key_path = None

        if cer_file:
            cer_filename = f"{rfc}.cer"
            cer_path = save_fiel_file(cer_file, cer_filename)

        if key_file:
            key_filename = f"{rfc}.key"
            key_path = save_fiel_file(key_file, key_filename)

        # Si no se subieron archivos nuevos, buscar los existentes
        if not cer_path:
            cer_path = os.path.join(FIEL_DIR, f"{rfc}.cer")
            cer_filename = f"{rfc}.cer"
        if not key_path:
            key_path = os.path.join(FIEL_DIR, f"{rfc}.key")
            key_filename = f"{rfc}.key"

        # Verificar archivos
        is_valid = verify_fiel_files(cer_path, key_path, password)

        # Cifrar contraseña
        encrypted_password = encrypt_password(password)

        # Guardar en archivo de configuración (JSON simple)
        config_file = os.path.join(FIEL_DIR, "fiel_config.json")
        import json
        config = {
            "rfc": rfc,
            "cer_filename": cer_filename,
            "key_filename": key_filename,
            "cer_path": cer_path,
            "key_path": key_path,
            "encrypted_password": encrypted_password,
            "configured_at": datetime.now().isoformat(),
            "configured_by": current_user.username,
            "is_valid": is_valid
        }

        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)

        return {
            "message": "Configuración de FIEL guardada exitosamente",
            "rfc": rfc,
            "cer_filename": cer_filename,
            "key_filename": key_filename,
            "configured_at": config["configured_at"],
            "is_valid": is_valid
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar configuración de FIEL: {str(e)}"
        )

@router.get("/fiel")
async def get_fiel_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la configuración actual de FIEL (sin contraseña)
    """
    # Verificar que el usuario sea admin
    if current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver la configuración de FIEL"
        )

    config_file = os.path.join(FIEL_DIR, "fiel_config.json")

    if not os.path.exists(config_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay configuración de FIEL guardada"
        )

    try:
        import json
        with open(config_file, 'r') as f:
            config = json.load(f)

        # No retornar la contraseña cifrada
        return {
            "rfc": config.get("rfc"),
            "cer_filename": config.get("cer_filename"),
            "key_filename": config.get("key_filename"),
            "configured_at": config.get("configured_at"),
            "configured_by": config.get("configured_by"),
            "is_valid": config.get("is_valid", False)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener configuración de FIEL: {str(e)}"
        )

@router.delete("/fiel")
async def delete_fiel_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina la configuración de FIEL y los archivos asociados
    """
    # Verificar que el usuario sea admin
    if current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar la configuración de FIEL"
        )

    config_file = os.path.join(FIEL_DIR, "fiel_config.json")

    if not os.path.exists(config_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay configuración de FIEL para eliminar"
        )

    try:
        import json
        # Leer configuración para obtener rutas de archivos
        with open(config_file, 'r') as f:
            config = json.load(f)

        # Eliminar archivos
        cer_path = config.get("cer_path")
        key_path = config.get("key_path")

        if cer_path and os.path.exists(cer_path):
            os.remove(cer_path)

        if key_path and os.path.exists(key_path):
            os.remove(key_path)

        # Eliminar archivo de configuración
        os.remove(config_file)

        return {"message": "Configuración de FIEL eliminada exitosamente"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar configuración de FIEL: {str(e)}"
        )

def get_fiel_credentials():
    """
    Función helper para obtener las credenciales FIEL descifradas
    Para uso interno del sistema (descarga masiva SAT, etc.)
    """
    config_file = os.path.join(FIEL_DIR, "fiel_config.json")

    if not os.path.exists(config_file):
        return None

    try:
        import json
        with open(config_file, 'r') as f:
            config = json.load(f)

        return {
            "rfc": config.get("rfc"),
            "cer_path": config.get("cer_path"),
            "key_path": config.get("key_path"),
            "password": decrypt_password(config.get("encrypted_password")),
            "is_valid": config.get("is_valid", False)
        }
    except Exception:
        return None


# ============================================
# Configuración General del Sistema
# ============================================

@router.get("/general", response_model=AppConfigResponse)
async def get_app_config(
    db: Session = Depends(get_db)
):
    """
    Obtiene la configuración general del sistema
    Este endpoint es público para que el login pueda mostrar el nombre
    """
    config = db.query(AppConfig).filter(AppConfig.is_active == True).first()

    if not config:
        # Crear configuración por defecto si no existe
        config = AppConfig(
            company_name="Portal",
            short_name="Portal",
            version="2.0",
            description="Sistema de validación de CFDIs",
            primary_color="#667eea",
            secondary_color="#764ba2",
            footer_text="© 2025 Portal. Todos los derechos reservados."
        )
        db.add(config)
        db.commit()
        db.refresh(config)

    return AppConfigResponse(
        id=config.id,
        company_name=config.company_name,
        short_name=config.short_name,
        version=config.version,
        description=config.description,
        primary_color=config.primary_color,
        secondary_color=config.secondary_color,
        contact_email=config.contact_email,
        contact_phone=config.contact_phone,
        address=config.address,
        company_rfc=config.company_rfc,
        footer_text=config.footer_text,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.put("/general", response_model=AppConfigResponse)
async def update_app_config(
    config_update: AppConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza la configuración general del sistema
    Solo administradores
    """
    if current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar la configuración general"
        )

    config = db.query(AppConfig).filter(AppConfig.is_active == True).first()

    if not config:
        # Crear si no existe
        config = AppConfig()
        db.add(config)

    # Actualizar campos proporcionados
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    config.updated_at = datetime.now()

    db.commit()
    db.refresh(config)

    return AppConfigResponse(
        id=config.id,
        company_name=config.company_name,
        short_name=config.short_name,
        version=config.version,
        description=config.description,
        primary_color=config.primary_color,
        secondary_color=config.secondary_color,
        contact_email=config.contact_email,
        contact_phone=config.contact_phone,
        address=config.address,
        company_rfc=config.company_rfc,
        footer_text=config.footer_text,
        created_at=config.created_at,
        updated_at=config.updated_at
    )
