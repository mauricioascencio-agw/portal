# -*- coding: utf-8 -*-
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET
import os
import shutil
from pathlib import Path
import zipfile
import tempfile
import logging
from logging.handlers import RotatingFileHandler
import requests
from pydantic import BaseModel
import base64
import hashlib
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography import x509
try:
    import rarfile
except ImportError:
    rarfile = None
try:
    import py7zr
except ImportError:
    py7zr = None

from ..db.database import get_db
from ..core.security import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/cfdis", tags=["cfdis"])

# Clase para validación
class ValidarCFDIRequest(BaseModel):
    uuid: str
    rfc_emisor: str
    rfc_receptor: str
    total: float

# Configurar logging
log_dir = Path("C:/Git/Coliman/portal-coliman/backend/logs")
log_dir.mkdir(parents=True, exist_ok=True)

# Crear logger específico para CFDI operations
logger = logging.getLogger('cfdi_operations')
logger.setLevel(logging.INFO)

# Handler con rotación de archivos (máximo 10MB por archivo, mantener 5 backups)
log_file = log_dir / f"cfdi_operations_{datetime.now().strftime('%Y%m%d')}.log"
handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
handler.setLevel(logging.INFO)

# Formato detallado del log
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Namespace del SAT para CFDI 4.0
NAMESPACES = {
    'cfdi': 'http://www.sat.gob.mx/cfd/4',
    'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'
}

def parse_cfdi_xml(xml_content: bytes) -> dict:
    """Parse CFDI XML and extract main fields"""
    try:
        root = ET.fromstring(xml_content)

        # Obtener UUID del timbre fiscal
        timbre = root.find('.//tfd:TimbreFiscalDigital', NAMESPACES)
        uuid = timbre.get('UUID') if timbre is not None else None

        # Datos del comprobante
        comprobante_data = {
            'uuid': uuid,
            'version': root.get('Version'),
            'fecha': root.get('Fecha'),
            'sello': root.get('Sello'),
            'forma_pago': root.get('FormaPago'),
            'no_certificado': root.get('NoCertificado'),
            'subtotal': float(root.get('SubTotal', 0)),
            'moneda': root.get('Moneda'),
            'total': float(root.get('Total', 0)),
            'tipo_comprobante': root.get('TipoDeComprobante'),
            'metodo_pago': root.get('MetodoPago'),
            'lugar_expedicion': root.get('LugarExpedicion'),
        }

        # Datos del emisor
        emisor = root.find('.//cfdi:Emisor', NAMESPACES)
        if emisor is not None:
            comprobante_data['emisor_rfc'] = emisor.get('Rfc')
            comprobante_data['emisor_nombre'] = emisor.get('Nombre')
            comprobante_data['emisor_regimen'] = emisor.get('RegimenFiscal')

        # Datos del receptor
        receptor = root.find('.//cfdi:Receptor', NAMESPACES)
        if receptor is not None:
            comprobante_data['receptor_rfc'] = receptor.get('Rfc')
            comprobante_data['receptor_nombre'] = receptor.get('Nombre')
            comprobante_data['receptor_uso_cfdi'] = receptor.get('UsoCFDI')

        # Impuestos
        impuestos = root.find('.//cfdi:Impuestos', NAMESPACES)
        if impuestos is not None:
            comprobante_data['total_impuestos_trasladados'] = float(impuestos.get('TotalImpuestosTrasladados', 0))
            comprobante_data['total_impuestos_retenidos'] = float(impuestos.get('TotalImpuestosRetenidos', 0))

        # Conceptos
        conceptos = []
        for concepto in root.findall('.//cfdi:Concepto', NAMESPACES):
            concepto_data = {
                'clave_prod_serv': concepto.get('ClaveProdServ'),
                'cantidad': float(concepto.get('Cantidad', 0)),
                'clave_unidad': concepto.get('ClaveUnidad'),
                'unidad': concepto.get('Unidad'),
                'descripcion': concepto.get('Descripcion'),
                'valor_unitario': float(concepto.get('ValorUnitario', 0)),
                'importe': float(concepto.get('Importe', 0)),
                'descuento': float(concepto.get('Descuento', 0))
            }
            conceptos.append(concepto_data)

        comprobante_data['conceptos'] = conceptos

        return comprobante_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al parsear XML: {str(e)}")


def extract_compressed_file(file_content: bytes, filename: str) -> List[tuple]:
    """Extract XML and PDF files from ZIP, RAR or 7Z archives"""
    extracted_files = []

    # Crear directorio temporal
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        compressed_path = temp_path / filename

        # Guardar archivo comprimido
        with open(compressed_path, 'wb') as f:
            f.write(file_content)

        try:
            # Intentar extraer como ZIP
            if filename.lower().endswith('.zip'):
                with zipfile.ZipFile(compressed_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_path)
            # Intentar extraer como RAR
            elif filename.lower().endswith('.rar') and rarfile:
                with rarfile.RarFile(compressed_path, 'r') as rar_ref:
                    rar_ref.extractall(temp_path)
            # Intentar extraer como 7Z
            elif filename.lower().endswith('.7z') and py7zr:
                with py7zr.SevenZipFile(compressed_path, mode='r') as z:
                    z.extractall(path=temp_path)
            else:
                return []

            # Buscar todos los archivos XML y PDF extraidos
            # Primero agrupar por nombre base (UUID)
            files_by_base = {}

            for file_path in temp_path.rglob('*'):
                if file_path.is_file():
                    file_lower = file_path.name.lower()
                    if file_lower.endswith('.xml') or file_lower.endswith('.pdf'):
                        # Obtener nombre base sin extension
                        base_name = file_path.stem

                        if base_name not in files_by_base:
                            files_by_base[base_name] = {'xml': None, 'pdf': None}

                        with open(file_path, 'rb') as f:
                            content = f.read()

                        if file_lower.endswith('.xml'):
                            files_by_base[base_name]['xml'] = (file_path.name, content)
                        elif file_lower.endswith('.pdf'):
                            files_by_base[base_name]['pdf'] = (file_path.name, content)

            # Devolver solo los que tienen XML (el PDF es opcional)
            for base_name, files in files_by_base.items():
                if files['xml']:
                    extracted_files.append({
                        'xml': files['xml'],
                        'pdf': files['pdf']
                    })

        except Exception as e:
            print(f"Error extracting {filename}: {str(e)}")

    return extracted_files


def save_xml_file(file: UploadFile, base_path: str) -> tuple:
    """Save XML file with date-based folder structure"""
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")

    # Crear estructura de carpetas: YYYY/MM/DD
    target_dir = Path(base_path) / year / month / day
    target_dir.mkdir(parents=True, exist_ok=True)

    # Guardar archivo
    file_path = target_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(file_path), f"{year}/{month}/{day}/{file.filename}"


def save_xml_content(filename: str, content: bytes, base_path: str) -> tuple:
    """Save XML content with date-based folder structure"""
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")

    # Crear estructura de carpetas: YYYY/MM/DD
    target_dir = Path(base_path) / year / month / day
    target_dir.mkdir(parents=True, exist_ok=True)

    # Guardar archivo
    file_path = target_dir / filename
    with open(file_path, "wb") as f:
        f.write(content)

    return str(file_path), f"{year}/{month}/{day}/{filename}"


def save_xml_and_pdf(xml_filename: str, xml_content: bytes, pdf_data: tuple, base_path: str) -> tuple:
    """Save XML and PDF files with date-based folder structure"""
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")

    # Crear estructura de carpetas: YYYY/MM/DD
    target_dir = Path(base_path) / year / month / day
    target_dir.mkdir(parents=True, exist_ok=True)

    # Guardar archivo XML
    xml_file_path = target_dir / xml_filename
    with open(xml_file_path, "wb") as f:
        f.write(xml_content)

    xml_relative_path = f"{year}/{month}/{day}/{xml_filename}"
    pdf_relative_path = None

    # Guardar archivo PDF si existe
    if pdf_data:
        pdf_filename, pdf_content = pdf_data
        pdf_file_path = target_dir / pdf_filename
        with open(pdf_file_path, "wb") as f:
            f.write(pdf_content)
        pdf_relative_path = f"{year}/{month}/{day}/{pdf_filename}"

    return xml_relative_path, pdf_relative_path


@router.post("/upload")
async def upload_cfdis(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subir archivos XML de CFDIs o archivos comprimidos (ZIP/RAR/7Z)
    - Soporta archivos XML, ZIP, RAR y 7Z
    - Extrae automáticamente archivos comprimidos
    - Valida información del CFDI
    - Guarda en estructura de carpetas por fecha: Insumos XML/YYYY/MM/DD
    - Registra en base de datos con estatus 'pendiente'
    - Evita duplicados por UUID
    """
    # Usar ruta dentro del contenedor Docker (mapeada a carpeta local)
    base_path = "/app/insumos_xml"
    results = []
    errors = []

    # Log inicio del proceso
    logger.info("="*80)
    logger.info(f"INICIO DE CARGA - Usuario: {current_user.email} (ID: {current_user.id}, Client: {current_user.client_id})")
    logger.info(f"Archivos recibidos: {len(files)}")
    for i, f in enumerate(files, 1):
        logger.info(f"  {i}. {f.filename} ({f.content_type})")

    for file in files:
        try:
            filename_lower = file.filename.lower()
            logger.info(f"\n>>> Procesando archivo: {file.filename}")

            # Verificar si es archivo comprimido (ZIP, RAR o 7Z)
            if filename_lower.endswith('.zip') or filename_lower.endswith('.rar') or filename_lower.endswith('.7z'):
                logger.info(f"    Tipo: Archivo comprimido ({file.filename.split('.')[-1].upper()})")

                # Leer contenido del archivo comprimido
                content = await file.read()
                logger.info(f"    Tamaño: {len(content)} bytes")

                # Extraer archivos XML del comprimido
                logger.info(f"    Extrayendo archivos...")
                extracted_files = extract_compressed_file(content, file.filename)

                if not extracted_files:
                    logger.warning(f"    ⚠ No se encontraron archivos XML en {file.filename}")
                    errors.append({
                        'filename': file.filename,
                        'error': 'No se encontraron archivos XML en el archivo comprimido'
                    })
                    continue

                logger.info(f"    ✓ Extraídos {len(extracted_files)} archivos XML")

                # Procesar cada XML extraído (con su PDF opcional)
                for idx, file_pair in enumerate(extracted_files, 1):
                    try:
                        # Extraer XML y PDF
                        xml_filename, xml_content = file_pair['xml']
                        pdf_data = file_pair['pdf']  # Puede ser None
                        logger.info(f"\n    [{idx}/{len(extracted_files)}] Procesando XML: {xml_filename}")
                        if pdf_data:
                            logger.info(f"        • PDF asociado: {pdf_data[0]}")

                        # Parsear XML
                        logger.info(f"        • Parseando XML...")
                        cfdi_data = parse_cfdi_xml(xml_content)

                        if not cfdi_data.get('uuid'):
                            logger.warning(f"        ⚠ No se encontró UUID en {xml_filename}")
                            errors.append({
                                'filename': f"{file.filename} > {xml_filename}",
                                'error': 'No se encontró UUID en el XML'
                            })
                            continue

                        logger.info(f"        • UUID: {cfdi_data['uuid']}")
                        logger.info(f"        • Emisor: {cfdi_data.get('emisor_nombre')} ({cfdi_data.get('emisor_rfc')})")
                        logger.info(f"        • Receptor: {cfdi_data.get('receptor_nombre')} ({cfdi_data.get('receptor_rfc')})")
                        logger.info(f"        • Total: ${cfdi_data['total']} {cfdi_data['moneda']}")

                        # Verificar duplicados en BD
                        logger.info(f"        • Verificando duplicados...")
                        existing_cfdi = db.execute(
                            text("""SELECT id FROM cfdi WHERE uuid = :uuid AND client_id = :client_id"""),
                            {"uuid": cfdi_data['uuid'], "client_id": current_user.client_id}
                        ).fetchone()

                        if existing_cfdi:
                            logger.warning(f"        ⚠ CFDI duplicado - UUID: {cfdi_data['uuid']}")
                            errors.append({
                                'filename': f"{file.filename} > {xml_filename}",
                                'error': f'CFDI duplicado (UUID: {cfdi_data["uuid"]})'
                            })
                            continue

                        # Guardar archivos XML y PDF
                        logger.info(f"        • Guardando archivos...")
                        xml_relative_path, pdf_relative_path = save_xml_and_pdf(
                            xml_filename, xml_content, pdf_data, base_path
                        )
                        logger.info(f"        • XML guardado en: Insumos XML/{xml_relative_path}")
                        if pdf_relative_path:
                            logger.info(f"        • PDF guardado en: Insumos XML/{pdf_relative_path}")

                        # Insertar en base de datos
                        logger.info(f"        • Insertando en base de datos...")
                        cfdi_id = db.execute(
                            text("""
                            INSERT INTO cfdi (
                                client_id, uuid, tipo_comprobante, serie, folio, fecha,
                                emisor_rfc, emisor_nombre, emisor_regimen,
                                receptor_rfc, receptor_nombre, receptor_uso_cfdi,
                                subtotal, descuento, total, moneda, tipo_cambio,
                                total_impuestos_trasladados, total_impuestos_retenidos,
                                metodo_pago, forma_pago,
                                xml_path, pdf_path, estatus_validacion
                            ) VALUES (
                                :client_id, :uuid, :tipo_comprobante, NULL, NULL, :fecha,
                                :emisor_rfc, :emisor_nombre, :emisor_regimen,
                                :receptor_rfc, :receptor_nombre, :receptor_uso_cfdi,
                                :subtotal, 0, :total, :moneda, 1,
                                :total_impuestos_trasladados, :total_impuestos_retenidos,
                                :metodo_pago, :forma_pago,
                                :xml_path, :pdf_path, 'pendiente'
                            )
                            """),
                            {
                                "client_id": current_user.client_id,
                                "uuid": cfdi_data['uuid'],
                                "tipo_comprobante": cfdi_data['tipo_comprobante'],
                                "fecha": cfdi_data['fecha'],
                                "emisor_rfc": cfdi_data.get('emisor_rfc'),
                                "emisor_nombre": cfdi_data.get('emisor_nombre'),
                                "emisor_regimen": cfdi_data.get('emisor_regimen'),
                                "receptor_rfc": cfdi_data.get('receptor_rfc'),
                                "receptor_nombre": cfdi_data.get('receptor_nombre'),
                                "receptor_uso_cfdi": cfdi_data.get('receptor_uso_cfdi'),
                                "subtotal": cfdi_data['subtotal'],
                                "total": cfdi_data['total'],
                                "moneda": cfdi_data['moneda'],
                                "total_impuestos_trasladados": cfdi_data.get('total_impuestos_trasladados', 0),
                                "total_impuestos_retenidos": cfdi_data.get('total_impuestos_retenidos', 0),
                                "metodo_pago": cfdi_data.get('metodo_pago'),
                                "forma_pago": cfdi_data.get('forma_pago'),
                                "xml_path": xml_relative_path,
                                "pdf_path": pdf_relative_path
                            }
                        )
                        db.commit()

                        cfdi_id_value = cfdi_id.lastrowid if hasattr(cfdi_id, 'lastrowid') else None
                        logger.info(f"        • CFDI registrado con ID: {cfdi_id_value}")

                        # Insertar conceptos
                        num_conceptos = len(cfdi_data.get('conceptos', []))
                        if num_conceptos > 0:
                            logger.info(f"        • Insertando {num_conceptos} conceptos...")
                        for concepto in cfdi_data.get('conceptos', []):
                            db.execute(
                                text("""
                                INSERT INTO cfdi_conceptos (
                                    cfdi_id, clave_prod_serv, clave_unidad, cantidad,
                                    descripcion, valor_unitario, importe, descuento
                                ) VALUES (
                                    :cfdi_id, :clave_prod_serv, :clave_unidad, :cantidad,
                                    :descripcion, :valor_unitario, :importe, :descuento
                                )
                                """),
                                {
                                    "cfdi_id": cfdi_id_value,
                                    **concepto
                                }
                            )
                        db.commit()
                        if num_conceptos > 0:
                            logger.info(f"        • ✓ Conceptos insertados correctamente")

                        logger.info(f"        ✓✓ PROCESADO EXITOSAMENTE: {xml_filename}")

                        results.append({
                            'filename': f"{file.filename} > {xml_filename}",
                            'uuid': cfdi_data['uuid'],
                            'status': 'success',
                            'path': f"Insumos XML/{xml_relative_path}",
                            'pdf_path': f"Insumos XML/{pdf_relative_path}" if pdf_relative_path else None
                        })

                    except Exception as e:
                        logger.error(f"        ✗ ERROR procesando {xml_filename}: {str(e)}")
                        errors.append({
                            'filename': f"{file.filename} > {xml_filename}",
                            'error': str(e)
                        })
                        continue

            # Si es archivo XML directo
            elif filename_lower.endswith('.xml'):
                logger.info(f"    Tipo: Archivo XML directo")

                # Leer contenido
                content = await file.read()
                logger.info(f"    Tamaño: {len(content)} bytes")

                # Parsear XML
                logger.info(f"    Parseando XML...")
                cfdi_data = parse_cfdi_xml(content)

                if not cfdi_data.get('uuid'):
                    logger.warning(f"    ⚠ No se encontró UUID en {file.filename}")
                    errors.append({
                        'filename': file.filename,
                        'error': 'No se encontro UUID en el XML'
                    })
                    continue

                logger.info(f"    UUID: {cfdi_data['uuid']}")
                logger.info(f"    Emisor: {cfdi_data.get('emisor_nombre')} ({cfdi_data.get('emisor_rfc')})")
                logger.info(f"    Receptor: {cfdi_data.get('receptor_nombre')} ({cfdi_data.get('receptor_rfc')})")
                logger.info(f"    Total: ${cfdi_data['total']} {cfdi_data['moneda']}")

                # Verificar duplicados en BD
                logger.info(f"    Verificando duplicados...")
                existing_cfdi = db.execute(
                    text("""SELECT id FROM cfdi WHERE uuid = :uuid AND client_id = :client_id"""),
                    {"uuid": cfdi_data['uuid'], "client_id": current_user.client_id}
                ).fetchone()

                if existing_cfdi:
                    logger.warning(f"    ⚠ CFDI duplicado - UUID: {cfdi_data['uuid']}")
                    errors.append({
                        'filename': file.filename,
                        'error': f'CFDI duplicado (UUID: {cfdi_data["uuid"]})'
                    })
                    continue

                # Resetear puntero del archivo para guardarlo
                file.file.seek(0)

                # Guardar archivo físico
                logger.info(f"    Guardando archivo...")
                full_path, relative_path = save_xml_file(file, base_path)
                logger.info(f"    Archivo guardado en: Insumos XML/{relative_path}")

                # Insertar en base de datos
                logger.info(f"    Insertando en base de datos...")
                cfdi_id = db.execute(
                    text("""
                    INSERT INTO cfdi (
                        client_id, uuid, tipo_comprobante, serie, folio, fecha,
                        emisor_rfc, emisor_nombre, emisor_regimen,
                        receptor_rfc, receptor_nombre, receptor_uso_cfdi,
                        subtotal, descuento, total, moneda, tipo_cambio,
                        total_impuestos_trasladados, total_impuestos_retenidos,
                        metodo_pago, forma_pago,
                        xml_path, estatus_validacion
                    ) VALUES (
                        :client_id, :uuid, :tipo_comprobante, NULL, NULL, :fecha,
                        :emisor_rfc, :emisor_nombre, :emisor_regimen,
                        :receptor_rfc, :receptor_nombre, :receptor_uso_cfdi,
                        :subtotal, 0, :total, :moneda, 1,
                        :total_impuestos_trasladados, :total_impuestos_retenidos,
                        :metodo_pago, :forma_pago,
                        :xml_path, 'pendiente'
                    )
                    """),
                    {
                        "client_id": current_user.client_id,
                        "uuid": cfdi_data['uuid'],
                        "tipo_comprobante": cfdi_data['tipo_comprobante'],
                        "fecha": cfdi_data['fecha'],
                        "emisor_rfc": cfdi_data.get('emisor_rfc'),
                        "emisor_nombre": cfdi_data.get('emisor_nombre'),
                        "emisor_regimen": cfdi_data.get('emisor_regimen'),
                        "receptor_rfc": cfdi_data.get('receptor_rfc'),
                        "receptor_nombre": cfdi_data.get('receptor_nombre'),
                        "receptor_uso_cfdi": cfdi_data.get('receptor_uso_cfdi'),
                        "subtotal": cfdi_data['subtotal'],
                        "total": cfdi_data['total'],
                        "moneda": cfdi_data['moneda'],
                        "total_impuestos_trasladados": cfdi_data.get('total_impuestos_trasladados', 0),
                        "total_impuestos_retenidos": cfdi_data.get('total_impuestos_retenidos', 0),
                        "metodo_pago": cfdi_data.get('metodo_pago'),
                        "forma_pago": cfdi_data.get('forma_pago'),
                        "xml_path": relative_path
                    }
                )
                db.commit()

                cfdi_id_value = cfdi_id.lastrowid if hasattr(cfdi_id, 'lastrowid') else None
                logger.info(f"    CFDI registrado con ID: {cfdi_id_value}")

                # Insertar conceptos
                num_conceptos = len(cfdi_data.get('conceptos', []))
                if num_conceptos > 0:
                    logger.info(f"    Insertando {num_conceptos} conceptos...")
                for concepto in cfdi_data.get('conceptos', []):
                    db.execute(
                        text("""
                        INSERT INTO cfdi_conceptos (
                            cfdi_id, clave_prod_serv, clave_unidad, cantidad,
                            descripcion, valor_unitario, importe, descuento
                        ) VALUES (
                            :cfdi_id, :clave_prod_serv, :clave_unidad, :cantidad,
                            :descripcion, :valor_unitario, :importe, :descuento
                        )
                        """),
                        {
                            "cfdi_id": cfdi_id_value,
                            **concepto
                        }
                    )
                db.commit()
                if num_conceptos > 0:
                    logger.info(f"    ✓ Conceptos insertados correctamente")

                logger.info(f"    ✓✓ PROCESADO EXITOSAMENTE: {file.filename}")

                results.append({
                    'filename': file.filename,
                    'uuid': cfdi_data['uuid'],
                    'status': 'success',
                    'path': relative_path
                })

            else:
                logger.warning(f"    ⚠ Formato no soportado: {file.filename}")
                errors.append({
                    'filename': file.filename,
                    'error': 'Formato de archivo no soportado. Solo se aceptan XML, ZIP, RAR y 7Z'
                })
                continue

        except Exception as e:
            logger.error(f"    ✗ ERROR CRÍTICO procesando {file.filename}: {str(e)}")
            errors.append({
                'filename': file.filename,
                'error': str(e)
            })
            continue

    # Log resumen final
    logger.info("\n" + "="*80)
    logger.info(f"RESUMEN FINAL DE CARGA")
    logger.info(f"  ✓ Exitosos: {len(results)}")
    logger.info(f"  ✗ Errores: {len(errors)}")
    logger.info(f"  Total archivos procesados: {len(files)}")
    if errors:
        logger.info(f"\nDetalles de errores:")
        for err in errors:
            logger.error(f"  - {err['filename']}: {err['error']}")
    logger.info("="*80 + "\n")

    return {
        'success': len(results),
        'errors': len(errors),
        'total_files': len(files),
        'results': results,
        'errors_detail': errors
    }


@router.post("/import-folder")
async def import_from_folder(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Importar todos los archivos XML de la carpeta Insumos XML
    - Escanea la carpeta C:/Git/Coliman/Insumos XML
    - Copia archivos a estructura de carpetas por fecha
    - Valida y registra en base de datos
    - Evita duplicados por UUID
    """
    # Usar ruta dentro del contenedor Docker (mapeada a carpeta local)
    base_path = "/app/insumos_xml"
    source_folder = Path(base_path) / "Insumos XML"

    if not source_folder.exists():
        raise HTTPException(status_code=404, detail=f"Carpeta no encontrada: {source_folder}")

    results = []
    errors = []

    # Buscar todos los archivos XML en la carpeta
    xml_files = list(source_folder.glob("*.xml"))

    if not xml_files:
        return {
            'success': 0,
            'errors': 0,
            'message': 'No se encontraron archivos XML en la carpeta',
            'results': [],
            'errors_detail': []
        }

    for xml_file in xml_files:
        try:
            # Leer contenido del archivo
            with open(xml_file, 'rb') as f:
                content = f.read()

            # Parsear XML
            cfdi_data = parse_cfdi_xml(content)

            if not cfdi_data.get('uuid'):
                errors.append({
                    'filename': xml_file.name,
                    'error': 'No se encontró UUID en el XML'
                })
                continue

            # Verificar duplicados en BD
            existing_cfdi = db.execute(
                text("""SELECT id FROM cfdi WHERE uuid = :uuid AND client_id = :client_id"""),
                {"uuid": cfdi_data['uuid'], "client_id": current_user.client_id}
            ).fetchone()

            if existing_cfdi:
                errors.append({
                    'filename': xml_file.name,
                    'error': f'CFDI duplicado (UUID: {cfdi_data["uuid"]})'
                })
                continue

            # Copiar archivo XML y PDF (si existe) a estructura de carpetas por fecha
            now = datetime.now()
            year = now.strftime("%Y")
            month = now.strftime("%m")
            day = now.strftime("%d")

            target_dir = Path(base_path) / year / month / day
            target_dir.mkdir(parents=True, exist_ok=True)

            # Copiar archivo XML
            target_file = target_dir / xml_file.name
            shutil.copy2(xml_file, target_file)
            xml_relative_path = f"{year}/{month}/{day}/{xml_file.name}"

            # Buscar y copiar PDF asociado (mismo nombre base)
            pdf_relative_path = None
            pdf_file = xml_file.with_suffix('.pdf')
            if pdf_file.exists():
                target_pdf = target_dir / pdf_file.name
                shutil.copy2(pdf_file, target_pdf)
                pdf_relative_path = f"{year}/{month}/{day}/{pdf_file.name}"

            # Insertar en base de datos
            cfdi_id = db.execute(
                text("""
                INSERT INTO cfdi (
                    client_id, uuid, tipo_comprobante, serie, folio, fecha,
                    emisor_rfc, emisor_nombre, emisor_regimen,
                    receptor_rfc, receptor_nombre, receptor_uso_cfdi,
                    subtotal, descuento, total, moneda, tipo_cambio,
                    total_impuestos_trasladados, total_impuestos_retenidos,
                    metodo_pago, forma_pago,
                    xml_path, pdf_path, estatus_validacion
                ) VALUES (
                    :client_id, :uuid, :tipo_comprobante, NULL, NULL, :fecha,
                    :emisor_rfc, :emisor_nombre, :emisor_regimen,
                    :receptor_rfc, :receptor_nombre, :receptor_uso_cfdi,
                    :subtotal, 0, :total, :moneda, 1,
                    :total_impuestos_trasladados, :total_impuestos_retenidos,
                    :metodo_pago, :forma_pago,
                    :xml_path, :pdf_path, 'pendiente'
                )
                """),
                {
                    "client_id": current_user.client_id,
                    "uuid": cfdi_data['uuid'],
                    "tipo_comprobante": cfdi_data['tipo_comprobante'],
                    "fecha": cfdi_data['fecha'],
                    "emisor_rfc": cfdi_data.get('emisor_rfc'),
                    "emisor_nombre": cfdi_data.get('emisor_nombre'),
                    "emisor_regimen": cfdi_data.get('emisor_regimen'),
                    "receptor_rfc": cfdi_data.get('receptor_rfc'),
                    "receptor_nombre": cfdi_data.get('receptor_nombre'),
                    "receptor_uso_cfdi": cfdi_data.get('receptor_uso_cfdi'),
                    "subtotal": cfdi_data['subtotal'],
                    "total": cfdi_data['total'],
                    "moneda": cfdi_data['moneda'],
                    "total_impuestos_trasladados": cfdi_data.get('total_impuestos_trasladados', 0),
                    "total_impuestos_retenidos": cfdi_data.get('total_impuestos_retenidos', 0),
                    "metodo_pago": cfdi_data.get('metodo_pago'),
                    "forma_pago": cfdi_data.get('forma_pago'),
                    "xml_path": xml_relative_path,
                    "pdf_path": pdf_relative_path
                }
            )
            db.commit()

            cfdi_id_value = cfdi_id.lastrowid if hasattr(cfdi_id, 'lastrowid') else None

            # Insertar conceptos
            for concepto in cfdi_data.get('conceptos', []):
                db.execute(
                    """
                    INSERT INTO cfdi_conceptos (
                        cfdi_id, clave_prod_serv, clave_unidad, cantidad,
                        descripcion, valor_unitario, importe, descuento
                    ) VALUES (
                        :cfdi_id, :clave_prod_serv, :clave_unidad, :cantidad,
                        :descripcion, :valor_unitario, :importe, :descuento
                    )
                    """,
                    {
                        "cfdi_id": cfdi_id_value,
                        **concepto
                    }
                )
            db.commit()

            results.append({
                'filename': xml_file.name,
                'uuid': cfdi_data['uuid'],
                'status': 'success',
                'path': relative_path
            })

        except Exception as e:
            errors.append({
                'filename': xml_file.name,
                'error': str(e)
            })
            continue

    return {
        'success': len(results),
        'errors': len(errors),
        'total_files': len(xml_files),
        'results': results,
        'errors_detail': errors
    }


@router.get("/list")
async def list_cfdis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Listar CFDIs del cliente"""
    cfdis = db.execute(
        text("""
        SELECT
            id, uuid, fecha, tipo_comprobante,
            emisor_rfc, emisor_nombre,
            receptor_rfc, receptor_nombre,
            subtotal, total, moneda,
            estatus_validacion, created_at
        FROM cfdi
        WHERE client_id = :client_id
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :skip
        """),
        {
            "client_id": current_user.client_id,
            "limit": limit,
            "skip": skip
        }
    ).fetchall()

    # Convertir a lista de diccionarios
    result = []
    for cfdi in cfdis:
        result.append({
            'id': cfdi[0],
            'uuid': cfdi[1],
            'fecha': str(cfdi[2]) if cfdi[2] else None,
            'tipo_comprobante': cfdi[3],
            'emisor_rfc': cfdi[4],
            'emisor_nombre': cfdi[5],
            'receptor_rfc': cfdi[6],
            'receptor_nombre': cfdi[7],
            'subtotal': float(cfdi[8]) if cfdi[8] else 0,
            'total': float(cfdi[9]) if cfdi[9] else 0,
            'moneda': cfdi[10],
            'estatus_validacion': cfdi[11],
            'created_at': str(cfdi[12]) if cfdi[12] else None
        })

    # Contar total
    total = db.execute(
        text("SELECT COUNT(*) FROM cfdi WHERE client_id = :client_id"),
        {"client_id": current_user.client_id}
    ).fetchone()[0]

    return {
        'data': result,
        'total': total,
        'skip': skip,
        'limit': limit
    }


@router.get("/{cfdi_id}")
async def get_cfdi(
    cfdi_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un CFDI por ID"""
    cfdi_row = db.execute(
        text("""
        SELECT
            id, uuid, fecha, tipo_comprobante, serie, folio,
            emisor_rfc, emisor_nombre, emisor_regimen,
            receptor_rfc, receptor_nombre, receptor_uso_cfdi,
            subtotal, descuento, total, moneda, tipo_cambio,
            total_impuestos_trasladados, total_impuestos_retenidos,
            metodo_pago, forma_pago,
            xml_path, estatus_validacion, created_at
        FROM cfdi
        WHERE id = :cfdi_id AND client_id = :client_id
        """),
        {"cfdi_id": cfdi_id, "client_id": current_user.client_id}
    ).fetchone()

    if not cfdi_row:
        raise HTTPException(status_code=404, detail="CFDI no encontrado")

    # Obtener conceptos
    conceptos_rows = db.execute(
        text("""
        SELECT
            clave_prod_serv, cantidad, clave_unidad, unidad,
            descripcion, valor_unitario, importe, descuento
        FROM cfdi_conceptos
        WHERE cfdi_id = :cfdi_id
        """),
        {"cfdi_id": cfdi_id}
    ).fetchall()

    conceptos = []
    for row in conceptos_rows:
        conceptos.append({
            'clave_prod_serv': row[0],
            'cantidad': float(row[1]) if row[1] else 0,
            'clave_unidad': row[2],
            'unidad': row[3],
            'descripcion': row[4],
            'valor_unitario': float(row[5]) if row[5] else 0,
            'importe': float(row[6]) if row[6] else 0,
            'descuento': float(row[7]) if row[7] else 0,
        })

    return {
        'id': cfdi_row[0],
        'uuid': cfdi_row[1],
        'fecha': cfdi_row[2],
        'tipo_comprobante': cfdi_row[3],
        'serie': cfdi_row[4],
        'folio': cfdi_row[5],
        'emisor_rfc': cfdi_row[6],
        'emisor_nombre': cfdi_row[7],
        'emisor_regimen': cfdi_row[8],
        'receptor_rfc': cfdi_row[9],
        'receptor_nombre': cfdi_row[10],
        'receptor_uso_cfdi': cfdi_row[11],
        'subtotal': float(cfdi_row[12]) if cfdi_row[12] else 0,
        'descuento': float(cfdi_row[13]) if cfdi_row[13] else 0,
        'total': float(cfdi_row[14]) if cfdi_row[14] else 0,
        'moneda': cfdi_row[15],
        'tipo_cambio': float(cfdi_row[16]) if cfdi_row[16] else 1,
        'total_impuestos_trasladados': float(cfdi_row[17]) if cfdi_row[17] else 0,
        'total_impuestos_retenidos': float(cfdi_row[18]) if cfdi_row[18] else 0,
        'metodo_pago': cfdi_row[19],
        'forma_pago': cfdi_row[20],
        'xml_path': cfdi_row[21],
        'estatus_validacion': cfdi_row[22],
        'created_at': cfdi_row[23],
        'conceptos': conceptos
    }


# ============================================================================
# MODELOS PYDANTIC PARA VALIDACIÓN Y DESCARGA MASIVA SAT
# ============================================================================

class ValidateCFDIRequest(BaseModel):
    """Request para validar CFDI con el SAT"""
    uuid: str
    emisor_rfc: str
    receptor_rfc: str
    total: float

class DescargaMasivaRequest(BaseModel):
    """Request para descarga masiva SAT"""
    fecha_inicio: str  # formato: YYYY-MM-DD
    fecha_fin: str     # formato: YYYY-MM-DD
    rfc_emisor: Optional[str] = None
    rfc_receptor: Optional[str] = None
    tipo_solicitud: str = "CFDI"  # CFDI o Metadata


# ============================================================================
# ENDPOINT: VALIDAR CFDI CON EL SAT
# ============================================================================

@router.post("/validate")
async def validate_cfdi_sat(
    request: ValidateCFDIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Valida un CFDI contra el servicio del SAT

    El SAT proporciona un servicio web para verificar la autenticidad de CFDIs.
    Este endpoint consulta el servicio y actualiza el estatus en la BD.

    IMPORTANTE: El servicio del SAT puede tener un delay de hasta 72 horas.
    """
    logger.info(f"Validando CFDI UUID: {request.uuid}")

    try:
        # URL del servicio de consulta del SAT
        sat_url = "https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc"

        # Preparar la expresión impresa (línea que aparece en el QR)
        # Formato: https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id={UUID}&re={RFC_EMISOR}&rr={RFC_RECEPTOR}&tt={TOTAL}&fe={ULTIMOS_8_SELLO}
        expresion_impresa = f"?re={request.rfc_emisor}&rr={request.rfc_receptor}&tt={request.total:.6f}&id={request.uuid}"

        # SOAP Envelope para consulta
        soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:Consulta>
         <tem:expresionImpresa><![CDATA[{expresion_impresa}]]></tem:expresionImpresa>
      </tem:Consulta>
   </soapenv:Body>
</soapenv:Envelope>"""

        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/IConsultaCFDIService/Consulta'
        }

        logger.info(f"Consultando SAT para UUID: {request.uuid}")

        # Hacer request al SAT
        response = requests.post(sat_url, data=soap_body, headers=headers, timeout=30)

        if response.status_code != 200:
            logger.error(f"Error en consulta SAT: {response.status_code} - {response.text}")
            raise HTTPException(status_code=502, detail=f"Error al consultar SAT: {response.status_code}")

        # Parse respuesta SOAP
        ns = {'s': 'http://schemas.xmlsoap.org/soap/envelope/',
              'a': 'http://tempuri.org/'}

        root = ET.fromstring(response.content)
        consulta_result = root.find('.//a:ConsultaResult', ns)

        if consulta_result is None:
            logger.warning(f"Respuesta SAT sin resultado para UUID: {request.uuid}")
            return {
                'uuid': request.uuid,
                'estado': 'No Encontrado',
                'es_cancelable': 'No Disponible',
                'estatus_cancelacion': 'No Disponible',
                'validacion_efos': 'No Disponible',
                'mensaje': 'El SAT no retornó información. Puede ser un delay de hasta 72 horas.'
            }

        # Extraer información de la respuesta
        codigo_estatus = consulta_result.find('.//a:CodigoEstatus', ns)
        estado = consulta_result.find('.//a:Estado', ns)
        es_cancelable = consulta_result.find('.//a:EsCancelable', ns)
        estatus_cancelacion = consulta_result.find('.//a:EstatusCancelacion', ns)
        validacion_efos = consulta_result.find('.//a:ValidacionEFOS', ns)

        resultado = {
            'uuid': request.uuid,
            'codigo_estatus': codigo_estatus.text if codigo_estatus is not None else 'N/A',
            'estado': estado.text if estado is not None else 'No Encontrado',
            'es_cancelable': es_cancelable.text if es_cancelable is not None else 'No Disponible',
            'estatus_cancelacion': estatus_cancelacion.text if estatus_cancelacion is not None else 'No Disponible',
            'validacion_efos': validacion_efos.text if validacion_efos is not None else 'No Disponible'
        }

        logger.info(f"Resultado validación SAT: {resultado}")

        # Actualizar estatus en BD si el CFDI existe
        estatus_bd = 'valido' if resultado['estado'] == 'Vigente' else 'rechazado' if resultado['estado'] == 'Cancelado' else 'pendiente'

        db.execute(
            text("""
            UPDATE cfdi
            SET estatus_validacion = :estatus,
                validacion_sat_fecha = NOW(),
                validacion_sat_respuesta = :respuesta
            WHERE uuid = :uuid AND client_id = :client_id
            """),
            {
                "estatus": estatus_bd,
                "respuesta": str(resultado),
                "uuid": request.uuid,
                "client_id": current_user.client_id
            }
        )
        db.commit()

        logger.info(f"CFDI actualizado en BD con estatus: {estatus_bd}")

        return resultado

    except requests.exceptions.Timeout:
        logger.error(f"Timeout al consultar SAT para UUID: {request.uuid}")
        raise HTTPException(status_code=504, detail="Timeout al consultar el servicio del SAT")
    except Exception as e:
        logger.error(f"Error validando CFDI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al validar CFDI: {str(e)}")

