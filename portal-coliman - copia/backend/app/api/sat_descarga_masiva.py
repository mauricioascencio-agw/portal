# -*- coding: utf-8 -*-
"""
SAT Descarga Masiva - Implementación usando satcfdi

Este módulo implementa la descarga masiva de CFDIs del SAT usando la librería satcfdi.
Requiere FIEL (Firma Electrónica Avanzada) para autenticación.

Referencias:
- https://satcfdi.readthedocs.io/en/stable/
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import base64
import os
import zipfile
import io
import logging

from ..db.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..api.config import get_fiel_credentials

logger = logging.getLogger('sat_descarga_masiva')

router = APIRouter(prefix="/api/sat-descarga-masiva", tags=["sat-descarga-masiva"])

# Directorio para almacenar descargas
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "downloads", "sat_masivo")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# ============================================================================
# MODELOS PYDANTIC
# ============================================================================

class SolicitudDescargaRequest(BaseModel):
    """Request para solicitar descarga masiva"""
    fecha_inicio: str  # YYYY-MM-DD
    fecha_fin: str     # YYYY-MM-DD
    tipo_descarga: str = "emitidos"  # "emitidos" o "recibidos"
    rfc_emisor: Optional[str] = None
    rfc_receptor: Optional[str] = None
    tipo_solicitud: str = "CFDI"  # CFDI o Metadata


class VerificaSolicitudRequest(BaseModel):
    """Request para verificar estado de solicitud"""
    solicitud_id: str


class DescargaPaqueteRequest(BaseModel):
    """Request para descargar paquete"""
    paquete_id: str


# ============================================================================
# HELPERS
# ============================================================================

def get_sat_service():
    """Obtiene el servicio SAT configurado con las credenciales FIEL"""
    try:
        from satcfdi.models import Signer
        from satcfdi.pacs.sat import SAT

        # Obtener credenciales FIEL del sistema
        creds = get_fiel_credentials()
        if not creds or not creds.get('is_valid'):
            raise HTTPException(
                status_code=400,
                detail="No hay credenciales FIEL configuradas o no son válidas. Por favor configura tu e.firma en Configuración > e.firma (FIEL) SAT"
            )

        # Cargar certificado y clave
        with open(creds['cer_path'], 'rb') as f:
            cer_data = f.read()

        with open(creds['key_path'], 'rb') as f:
            key_data = f.read()

        # Crear el signer
        signer = Signer.load(
            certificate=cer_data,
            key=key_data,
            password=creds['password']
        )

        # Crear instancia del servicio SAT
        sat_service = SAT(signer=signer)

        return sat_service, signer

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="La librería satcfdi no está instalada. Por favor ejecuta: pip install satcfdi"
        )
    except Exception as e:
        logger.error(f"Error al configurar servicio SAT: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al configurar servicio SAT: {str(e)}"
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/solicitar-emitidos")
async def solicitar_descarga_emitidos(
    request: SolicitudDescargaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Solicita descarga masiva de CFDIs EMITIDOS

    Esto descargará todos los CFDIs que TÚ emitiste (ventas/ingresos)
    """
    try:
        from satcfdi.pacs.sat import TipoDescargaMasivaTerceros
        from datetime import datetime

        logger.info(f"Solicitando descarga de emitidos: {request.fecha_inicio} a {request.fecha_fin}")

        sat_service, signer = get_sat_service()

        # Parsear fechas
        fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
        fecha_fin = datetime.strptime(request.fecha_fin, "%Y-%m-%d")

        # Solicitar descarga de emitidos
        response = sat_service.recover_comprobante_emitted_request(
            fecha_inicial=fecha_inicio.date(),
            fecha_final=fecha_fin.date(),
            rfc_receptor=request.rfc_receptor or signer.rfc,
            tipo_solicitud=TipoDescargaMasivaTerceros.CFDI if request.tipo_solicitud == "CFDI" else TipoDescargaMasivaTerceros.METADATA
        )

        solicitud_id = response.id_solicitud

        logger.info(f"Solicitud de emitidos creada exitosamente: {solicitud_id}")

        return {
            "success": True,
            "mensaje": "Solicitud de descarga de CFDIs emitidos creada exitosamente",
            "solicitud_id": solicitud_id,
            "codigo_estado": response.codigo_estado_solicitud,
            "fecha_inicio": request.fecha_inicio,
            "fecha_fin": request.fecha_fin,
            "tipo": "emitidos"
        }

    except Exception as e:
        logger.error(f"Error al solicitar descarga de emitidos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al solicitar descarga: {str(e)}"
        )


@router.post("/solicitar-recibidos")
async def solicitar_descarga_recibidos(
    request: SolicitudDescargaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Solicita descarga masiva de CFDIs RECIBIDOS

    Esto descargará todos los CFDIs que recibiste (compras/gastos)
    """
    try:
        from satcfdi.pacs.sat import TipoDescargaMasivaTerceros
        from datetime import datetime

        logger.info(f"Solicitando descarga de recibidos: {request.fecha_inicio} a {request.fecha_fin}")

        sat_service, signer = get_sat_service()

        # Parsear fechas
        fecha_inicio = datetime.strptime(request.fecha_inicio, "%Y-%m-%d")
        fecha_fin = datetime.strptime(request.fecha_fin, "%Y-%m-%d")

        # Solicitar descarga de recibidos
        response = sat_service.recover_comprobante_received_request(
            fecha_inicial=fecha_inicio.date(),
            fecha_final=fecha_fin.date(),
            rfc_receptor=signer.rfc,
            tipo_solicitud=TipoDescargaMasivaTerceros.CFDI if request.tipo_solicitud == "CFDI" else TipoDescargaMasivaTerceros.METADATA
        )

        solicitud_id = response.id_solicitud

        logger.info(f"Solicitud de recibidos creada exitosamente: {solicitud_id}")

        return {
            "success": True,
            "mensaje": "Solicitud de descarga de CFDIs recibidos creada exitosamente",
            "solicitud_id": solicitud_id,
            "codigo_estado": response.codigo_estado_solicitud,
            "fecha_inicio": request.fecha_inicio,
            "fecha_fin": request.fecha_fin,
            "tipo": "recibidos"
        }

    except Exception as e:
        logger.error(f"Error al solicitar descarga de recibidos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al solicitar descarga: {str(e)}"
        )


@router.post("/verificar")
async def verificar_solicitud(
    request: VerificaSolicitudRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifica el estado de una solicitud de descarga

    Estados posibles:
    - 1: Aceptada
    - 2: En proceso
    - 3: Terminada (lista para descargar)
    - 4: Error
    - 5: Rechazada
    - 6: Vencida
    """
    try:
        from satcfdi.pacs.sat import EstadoSolicitud

        logger.info(f"Verificando solicitud: {request.solicitud_id}")

        sat_service, signer = get_sat_service()

        # Verificar estado de la solicitud
        response = sat_service.recover_comprobante_status(request.solicitud_id)

        # Convertir código de estado a texto
        estado_map = {
            1: "Aceptada",
            2: "En Proceso",
            3: "Terminada",
            4: "Error",
            5: "Rechazada",
            6: "Vencida"
        }

        estado_codigo = response.estado_solicitud
        estado_texto = estado_map.get(estado_codigo, f"Desconocido ({estado_codigo})")

        # Obtener IDs de paquetes si está terminada
        paquetes = []
        if estado_codigo == 3:  # Terminada
            paquetes = response.paquetes

        logger.info(f"Estado de solicitud {request.solicitud_id}: {estado_texto}")

        return {
            "success": True,
            "solicitud_id": request.solicitud_id,
            "estado_codigo": estado_codigo,
            "estado_texto": estado_texto,
            "codigo_estado_solicitud": response.codigo_estado_solicitud,
            "numero_cfdis": response.numero_cfdis if hasattr(response, 'numero_cfdis') else 0,
            "paquetes": paquetes,
            "mensaje": response.mensaje if hasattr(response, 'mensaje') else ""
        }

    except Exception as e:
        logger.error(f"Error al verificar solicitud: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al verificar solicitud: {str(e)}"
        )


@router.post("/descargar-paquete")
async def descargar_paquete(
    request: DescargaPaqueteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Descarga un paquete de CFDIs

    El paquete se guarda en el servidor y se retorna la ruta
    """
    try:
        logger.info(f"Descargando paquete: {request.paquete_id}")

        sat_service, signer = get_sat_service()

        # Descargar paquete
        response = sat_service.recover_comprobante_download(id_paquete=request.paquete_id)

        # El paquete viene en base64
        paquete_data = response.paquete

        # Decodificar base64
        zip_data = base64.b64decode(paquete_data)

        # Guardar archivo ZIP
        zip_filename = f"{request.paquete_id}.zip"
        zip_path = os.path.join(DOWNLOADS_DIR, zip_filename)

        with open(zip_path, 'wb') as f:
            f.write(zip_data)

        # Extraer ZIP y contar archivos
        extract_dir = os.path.join(DOWNLOADS_DIR, request.paquete_id)
        os.makedirs(extract_dir, exist_ok=True)

        archivos_extraidos = []
        with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            archivos_extraidos = zip_ref.namelist()

        logger.info(f"Paquete {request.paquete_id} descargado: {len(archivos_extraidos)} archivos")

        return {
            "success": True,
            "mensaje": "Paquete descargado exitosamente",
            "paquete_id": request.paquete_id,
            "zip_path": zip_path,
            "extract_dir": extract_dir,
            "archivos_extraidos": len(archivos_extraidos),
            "archivos": archivos_extraidos[:10]  # Primeros 10 archivos
        }

    except Exception as e:
        logger.error(f"Error al descargar paquete: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al descargar paquete: {str(e)}"
        )


@router.post("/procesar-descarga-completa")
async def procesar_descarga_completa(
    solicitud_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Procesa una descarga completa: verifica estado, descarga todos los paquetes y procesa XMLs
    """
    try:
        logger.info(f"Procesando descarga completa para solicitud: {solicitud_id}")

        sat_service, signer = get_sat_service()

        # 1. Verificar estado
        status_response = sat_service.recover_comprobante_status(solicitud_id)

        if status_response.estado_solicitud != 3:
            return {
                "success": False,
                "mensaje": "La solicitud aún no está terminada. Por favor espera a que el SAT procese la solicitud.",
                "estado": status_response.estado_solicitud
            }

        paquetes = status_response.paquetes

        # 2. Descargar todos los paquetes
        archivos_totales = []
        for paquete_id in paquetes:
            try:
                response = sat_service.recover_comprobante_download(id_paquete=paquete_id)
                zip_data = base64.b64decode(response.paquete)

                # Extraer
                extract_dir = os.path.join(DOWNLOADS_DIR, solicitud_id, paquete_id)
                os.makedirs(extract_dir, exist_ok=True)

                with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
                    archivos_totales.extend([os.path.join(extract_dir, name) for name in zip_ref.namelist()])

            except Exception as e:
                logger.error(f"Error descargando paquete {paquete_id}: {str(e)}")

        logger.info(f"Descarga completa: {len(archivos_totales)} archivos descargados")

        return {
            "success": True,
            "mensaje": "Descarga completa procesada exitosamente",
            "solicitud_id": solicitud_id,
            "paquetes_procesados": len(paquetes),
            "archivos_descargados": len(archivos_totales),
            "directorio": os.path.join(DOWNLOADS_DIR, solicitud_id)
        }

    except Exception as e:
        logger.error(f"Error en descarga completa: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error en descarga completa: {str(e)}"
        )


@router.get("/info")
async def info_descarga_masiva():
    """
    Información sobre el servicio de descarga masiva del SAT
    """
    return {
        "version": "2.0 (usando satcfdi)",
        "fecha_actualizacion": "2025-12-15",
        "descripcion": "Web Service de Descarga Masiva del SAT usando la librería satcfdi",
        "estado": "✅ FUNCIONAL",
        "requisitos": [
            "FIEL vigente (Firma Electrónica Avanzada)",
            "Certificado .cer y llave privada .key configurados en el sistema",
            "Contraseña de la llave privada"
        ],
        "flujo": [
            "1. Configura tu e.firma en Configuración > e.firma (FIEL) SAT",
            "2. Solicita descarga de emitidos o recibidos con rango de fechas",
            "3. Verifica estado de la solicitud (puede tardar minutos)",
            "4. Descarga paquetes cuando estén listos",
            "5. Los XMLs se extraen automáticamente"
        ],
        "endpoints": [
            "POST /solicitar-emitidos - Solicita CFDIs que emitiste (ventas)",
            "POST /solicitar-recibidos - Solicita CFDIs que recibiste (compras)",
            "POST /verificar - Verifica estado de solicitud",
            "POST /descargar-paquete - Descarga un paquete específico",
            "POST /procesar-descarga-completa - Descarga y procesa todo automáticamente"
        ],
        "limitaciones": [
            "Máximo 5 años fiscales + año actual",
            "Procesamiento asíncrono (puede tardar minutos u horas según volumen)",
            "Requiere FIEL vigente y configurada"
        ]
    }
