# -*- coding: utf-8 -*-
"""
API para Constancia Fiscal
Procesamiento y almacenamiento de Constancias de Situación Fiscal del SAT
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import PyPDF2
import io
import re
import json
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.constancia_fiscal import ConstanciaFiscal, ActividadEconomica, ObligacionFiscal
from app.core.security import get_current_user

router = APIRouter(prefix="/api/constancia-fiscal", tags=["Constancia Fiscal"])


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extraer texto del PDF"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer PDF: {str(e)}"
        )


def parse_constancia_data(text: str) -> dict:
    """
    Extraer datos de la constancia fiscal del texto del PDF
    """
    data = {}

    # RFC
    rfc_match = re.search(r'RFC:\s*([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})', text)
    if rfc_match:
        data['rfc'] = rfc_match.group(1)

    # Razón Social / Denominación
    razon_match = re.search(r'Denominación/Razón Social:\s*([^\n]+)', text, re.IGNORECASE)
    if razon_match:
        data['razon_social'] = razon_match.group(1).strip()

    # Nombre Comercial
    comercial_match = re.search(r'Nombre Comercial:\s*([^\n]+)', text, re.IGNORECASE)
    if comercial_match:
        data['nombre_comercial'] = comercial_match.group(1).strip()

    # Régimen Capital
    regimen_match = re.search(r'Régimen Capital:\s*([^\n]+)', text, re.IGNORECASE)
    if regimen_match:
        data['regimen_capital'] = regimen_match.group(1).strip()

    # Fecha inicio de operaciones
    inicio_match = re.search(r'Fecha inicio de operaciones:\s*(\d{2} DE [A-Z]+ DE \d{4})', text, re.IGNORECASE)
    if inicio_match:
        data['fecha_inicio_operaciones'] = parse_spanish_date(inicio_match.group(1))

    # Estatus en el padrón
    estatus_match = re.search(r'Estatus en el padrón:\s*([^\n]+)', text, re.IGNORECASE)
    if estatus_match:
        data['estatus_padron'] = estatus_match.group(1).strip()

    # Domicilio
    data['codigo_postal'] = extract_field(text, r'Código Postal:\s*(\d+)')
    data['tipo_vialidad'] = extract_field(text, r'Tipo de Vialidad:\s*([^\n]+)')
    data['nombre_vialidad'] = extract_field(text, r'Nombre de Vialidad:\s*([^\n]+)')
    data['numero_exterior'] = extract_field(text, r'Número Exterior:\s*(\d+)')
    data['numero_interior'] = extract_field(text, r'Número Interior:\s*([^\n]*)')
    data['nombre_colonia'] = extract_field(text, r'Nombre de la Colonia:\s*([^\n]+)')
    data['nombre_localidad'] = extract_field(text, r'Nombre de la Localidad:\s*([^\n]+)')
    data['nombre_municipio'] = extract_field(text, r'Nombre del Municipio.*:\s*([^\n]+)')
    data['nombre_entidad'] = extract_field(text, r'Nombre de la Entidad Federativa:\s*([^\n]+)')
    data['entre_calle'] = extract_field(text, r'Entre Calle:\s*([^\n]+)')
    data['y_calle'] = extract_field(text, r'Y Calle:\s*([^\n]+)')

    # Lugar y fecha de emisión
    lugar_match = re.search(r'Lugar y Fecha de Emisión\s*([^,]+)', text, re.IGNORECASE)
    if lugar_match:
        data['lugar_emision'] = lugar_match.group(1).strip()

    fecha_emision_match = re.search(r'Lugar y Fecha de Emisión[^\n]*,?\s*([A-Z]+\s*,\s*[A-Z]+\s*A\s*\d{2}\s*DE\s*[A-Z]+\s*DE\s*\d{4})', text, re.IGNORECASE)
    if fecha_emision_match:
        data['fecha_emision'] = parse_spanish_date(fecha_emision_match.group(1))

    # Folio
    folio_match = re.search(r'([A-Z0-9]{12,})\s*$', text.split('\n')[0])
    if folio_match:
        data['folio_constancia'] = folio_match.group(1)

    # Actividades económicas
    data['actividades'] = extract_actividades(text)

    # Regímenes
    data['regimenes'] = extract_regimenes(text)

    # Obligaciones
    data['obligaciones'] = extract_obligaciones(text)

    return data


def extract_field(text: str, pattern: str) -> Optional[str]:
    """Extraer campo con regex"""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else None


def parse_spanish_date(date_str: str) -> Optional[str]:
    """Convertir fecha en español a formato ISO"""
    months = {
        'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
        'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
        'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
    }

    try:
        # Ejemplo: "12 DE MAYO DE 1998" -> "1998-05-12"
        parts = date_str.upper().split()
        day = parts[0].zfill(2)
        month = months.get(parts[2])
        year = parts[4]

        if month:
            return f"{year}-{month}-{day}"
    except:
        pass

    return None


def extract_actividades(text: str) -> list:
    """Extraer actividades económicas"""
    actividades = []

    # Buscar sección de actividades
    actividades_section = re.search(r'Orden\s+Actividad Económica\s+Porcentaje\s+Fecha Inicio\s+Fecha Fin\s+(.*?)(?=\n\s*Regímenes:|\Z)', text, re.DOTALL | re.IGNORECASE)

    if actividades_section:
        lines = actividades_section.group(1).strip().split('\n')
        for line in lines:
            # Ejemplo: "1    Siembra, cultivo y cosecha de plátano    80    01/01/2021"
            match = re.match(r'(\d+)\s+(.+?)\s+(\d+)\s+(\d{2}/\d{2}/\d{4})', line.strip())
            if match:
                actividades.append({
                    'orden': int(match.group(1)),
                    'actividad': match.group(2).strip(),
                    'porcentaje': int(match.group(3)),
                    'fecha_inicio': match.group(4)
                })

    return actividades


def extract_regimenes(text: str) -> list:
    """Extraer regímenes fiscales"""
    regimenes = []

    regimen_match = re.search(r'Régimen\s+Fecha Inicio\s+Fecha Fin\s+(.*?)(?=\n\s*Obligaciones:|\Z)', text, re.DOTALL | re.IGNORECASE)

    if regimen_match:
        lines = regimen_match.group(1).strip().split('\n')
        for line in lines:
            if line.strip():
                parts = line.strip().split()
                if len(parts) >= 2:
                    regimenes.append({
                        'regimen': ' '.join(parts[:-2]) if len(parts) > 2 else parts[0],
                        'fecha_inicio': parts[-2] if len(parts) >= 2 else None,
                        'fecha_fin': parts[-1] if len(parts) >= 1 else None
                    })

    return regimenes


def extract_obligaciones(text: str) -> list:
    """Extraer obligaciones fiscales"""
    obligaciones = []

    oblig_section = re.search(r'Obligaciones:.*?Descripción de la Obligación\s+Descripción Vencimiento\s+Fecha Inicio\s+Fecha Fin\s+(.*?)(?=\Z)', text, re.DOTALL | re.IGNORECASE)

    if oblig_section:
        lines = oblig_section.group(1).strip().split('\n')
        for line in lines:
            if line.strip() and len(line.strip()) > 10:
                obligaciones.append({
                    'descripcion': line.strip()
                })

    return obligaciones


@router.post("/upload")
async def upload_constancia(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subir y procesar Constancia de Situación Fiscal (PDF)
    """
    # Validar que sea PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos PDF"
        )

    # Leer contenido
    content = await file.read()

    # Extraer texto
    text = extract_text_from_pdf(content)

    # Parsear datos
    data = parse_constancia_data(text)

    if not data.get('rfc'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo extraer el RFC de la constancia"
        )

    # Verificar si ya existe
    existing = db.query(ConstanciaFiscal).filter(
        ConstanciaFiscal.rfc == data['rfc']
    ).first()

    if existing:
        # Actualizar existente
        for key, value in data.items():
            if key not in ['actividades', 'regimenes', 'obligaciones'] and value is not None:
                setattr(existing, key, value)

        existing.updated_at = datetime.now()
        existing.pdf_filename = file.filename
        existing.regimenes = json.dumps(data.get('regimenes', []))

        # Eliminar actividades y obligaciones antiguas
        db.query(ActividadEconomica).filter(
            ActividadEconomica.constancia_id == existing.id
        ).delete()

        db.query(ObligacionFiscal).filter(
            ObligacionFiscal.constancia_id == existing.id
        ).delete()

        constancia = existing

    else:
        # Crear nueva
        constancia = ConstanciaFiscal(
            rfc=data.get('rfc'),
            razon_social=data.get('razon_social'),
            nombre_comercial=data.get('nombre_comercial'),
            regimen_capital=data.get('regimen_capital'),
            fecha_inicio_operaciones=data.get('fecha_inicio_operaciones'),
            estatus_padron=data.get('estatus_padron'),
            codigo_postal=data.get('codigo_postal'),
            tipo_vialidad=data.get('tipo_vialidad'),
            nombre_vialidad=data.get('nombre_vialidad'),
            numero_exterior=data.get('numero_exterior'),
            numero_interior=data.get('numero_interior'),
            nombre_colonia=data.get('nombre_colonia'),
            nombre_localidad=data.get('nombre_localidad'),
            nombre_municipio=data.get('nombre_municipio'),
            nombre_entidad=data.get('nombre_entidad'),
            entre_calle=data.get('entre_calle'),
            y_calle=data.get('y_calle'),
            lugar_emision=data.get('lugar_emision'),
            fecha_emision=data.get('fecha_emision'),
            folio_constancia=data.get('folio_constancia'),
            pdf_filename=file.filename,
            regimenes=json.dumps(data.get('regimenes', [])),
            client_id=current_user.client_id,
            created_by=current_user.id
        )

        db.add(constancia)
        db.flush()

    # Agregar actividades
    for act in data.get('actividades', []):
        actividad = ActividadEconomica(
            constancia_id=constancia.id,
            orden=act.get('orden'),
            actividad=act.get('actividad'),
            porcentaje=act.get('porcentaje'),
            fecha_inicio=act.get('fecha_inicio')
        )
        db.add(actividad)

    # Agregar obligaciones
    for oblig in data.get('obligaciones', []):
        obligacion = ObligacionFiscal(
            constancia_id=constancia.id,
            descripcion=oblig.get('descripcion')
        )
        db.add(obligacion)

    db.commit()
    db.refresh(constancia)

    return {
        "success": True,
        "message": "✅ Constancia Fiscal importada correctamente",
        "data": {
            "rfc": constancia.rfc,
            "razon_social": constancia.razon_social,
            "domicilio": f"{constancia.nombre_vialidad} #{constancia.numero_exterior}, {constancia.nombre_colonia}",
            "actividades_count": len(data.get('actividades', [])),
            "obligaciones_count": len(data.get('obligaciones', []))
        }
    }


@router.get("/")
async def get_constancia(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener constancia fiscal del cliente actual"""
    constancia = db.query(ConstanciaFiscal).filter(
        ConstanciaFiscal.client_id == current_user.client_id,
        ConstanciaFiscal.is_active == True
    ).first()

    if not constancia:
        return {"data": None}

    # Convertir a dict
    data = {
        "id": constancia.id,
        "rfc": constancia.rfc,
        "razon_social": constancia.razon_social,
        "nombre_comercial": constancia.nombre_comercial,
        "regimen_capital": constancia.regimen_capital,
        "fecha_inicio_operaciones": constancia.fecha_inicio_operaciones.isoformat() if constancia.fecha_inicio_operaciones else None,
        "estatus_padron": constancia.estatus_padron,
        "domicilio": {
            "codigo_postal": constancia.codigo_postal,
            "tipo_vialidad": constancia.tipo_vialidad,
            "nombre_vialidad": constancia.nombre_vialidad,
            "numero_exterior": constancia.numero_exterior,
            "numero_interior": constancia.numero_interior,
            "colonia": constancia.nombre_colonia,
            "localidad": constancia.nombre_localidad,
            "municipio": constancia.nombre_municipio,
            "entidad": constancia.nombre_entidad
        },
        "actividades": [
            {
                "orden": act.orden,
                "actividad": act.actividad,
                "porcentaje": act.porcentaje
            }
            for act in constancia.actividades
        ],
        "regimenes": json.loads(constancia.regimenes) if constancia.regimenes else [],
        "obligaciones": [
            {"descripcion": oblig.descripcion}
            for oblig in constancia.obligaciones
        ],
        "fecha_emision": constancia.fecha_emision.isoformat() if constancia.fecha_emision else None,
        "created_at": constancia.created_at.isoformat() if constancia.created_at else None
    }

    return {"data": data}
