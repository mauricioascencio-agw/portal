# -*- coding: utf-8 -*-
"""
Modelo de Base de Datos para Configuración General del Sistema
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class AppConfig(Base):
    """Configuración general del portal"""
    __tablename__ = "app_configs"

    id = Column(Integer, primary_key=True, index=True)

    # Nombre de la empresa/portal
    company_name = Column(String(255), nullable=False, default="Portal")

    # Nombre corto para branding
    short_name = Column(String(100), nullable=True, default="Portal")

    # Versión del portal
    version = Column(String(20), nullable=True, default="2.0")

    # Descripción
    description = Column(Text, nullable=True)

    # Logo URL (ruta al logo)
    logo_url = Column(String(500), nullable=True)

    # Favicon URL
    favicon_url = Column(String(500), nullable=True)

    # Color primario (hex)
    primary_color = Column(String(7), nullable=True, default="#667eea")

    # Color secundario (hex)
    secondary_color = Column(String(7), nullable=True, default="#764ba2")

    # Email de contacto
    contact_email = Column(String(255), nullable=True)

    # Teléfono de contacto
    contact_phone = Column(String(50), nullable=True)

    # Dirección
    address = Column(Text, nullable=True)

    # RFC de la empresa
    company_rfc = Column(String(13), nullable=True)

    # Footer text
    footer_text = Column(Text, nullable=True)

    # Mostrar en login/registro
    show_on_login = Column(Boolean, default=True)

    # Cliente al que pertenece (para multi-tenancy)
    client_id = Column(String(50), nullable=True, index=True)

    # Estado
    is_active = Column(Boolean, default=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
