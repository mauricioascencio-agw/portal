# -*- coding: utf-8 -*-
"""
Modelo de Constancia Fiscal
"""

from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class ConstanciaFiscal(Base):
    """
    Constancia de Situación Fiscal del SAT
    """
    __tablename__ = "constancias_fiscales"

    id = Column(Integer, primary_key=True, index=True)

    # Datos del contribuyente
    rfc = Column(String(13), unique=True, index=True, nullable=False)
    razon_social = Column(String(255), nullable=False)
    nombre_comercial = Column(String(255), nullable=True)
    regimen_capital = Column(String(255), nullable=True)
    fecha_inicio_operaciones = Column(Date, nullable=True)
    estatus_padron = Column(String(50), nullable=True)
    fecha_ultimo_cambio = Column(Date, nullable=True)

    # Domicilio fiscal
    codigo_postal = Column(String(10), nullable=True)
    tipo_vialidad = Column(String(100), nullable=True)
    nombre_vialidad = Column(String(255), nullable=True)
    numero_exterior = Column(String(50), nullable=True)
    numero_interior = Column(String(50), nullable=True)
    nombre_colonia = Column(String(255), nullable=True)
    nombre_localidad = Column(String(255), nullable=True)
    nombre_municipio = Column(String(255), nullable=True)
    nombre_entidad = Column(String(255), nullable=True)
    entre_calle = Column(String(255), nullable=True)
    y_calle = Column(String(255), nullable=True)

    # Datos de emisión
    lugar_emision = Column(String(255), nullable=True)
    fecha_emision = Column(Date, nullable=True)
    folio_constancia = Column(String(50), nullable=True)

    # Código QR (base64 o URL)
    codigo_qr = Column(Text, nullable=True)

    # Archivo PDF
    pdf_filename = Column(String(255), nullable=True)
    pdf_path = Column(String(500), nullable=True)

    # Regímenes fiscales (JSON o relación)
    regimenes = Column(Text, nullable=True)  # JSON string

    # Metadatos
    client_id = Column(String(100), index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    is_active = Column(Boolean, default=True)

    # Relación con usuario
    creator = relationship("User", foreign_keys=[created_by])


class ActividadEconomica(Base):
    """
    Actividades económicas del contribuyente
    """
    __tablename__ = "actividades_economicas"

    id = Column(Integer, primary_key=True, index=True)
    constancia_id = Column(Integer, ForeignKey("constancias_fiscales.id"), nullable=False)

    orden = Column(Integer, nullable=True)
    actividad = Column(Text, nullable=False)
    porcentaje = Column(Integer, nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.now)

    # Relación con constancia
    constancia = relationship("ConstanciaFiscal", backref="actividades")


class ObligacionFiscal(Base):
    """
    Obligaciones fiscales del contribuyente
    """
    __tablename__ = "obligaciones_fiscales"

    id = Column(Integer, primary_key=True, index=True)
    constancia_id = Column(Integer, ForeignKey("constancias_fiscales.id"), nullable=False)

    descripcion = Column(Text, nullable=False)
    vencimiento = Column(String(500), nullable=True)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.now)

    # Relación con constancia
    constancia = relationship("ConstanciaFiscal", backref="obligaciones")
