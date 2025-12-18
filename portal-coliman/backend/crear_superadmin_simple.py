#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simple para crear un usuario SUPERADMIN
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def crear_superadmin_automatico():
    """Crear usuario superadmin con valores predeterminados"""
    db = SessionLocal()

    try:
        # Verificar si ya existe
        existing = db.query(User).filter(User.email == "inge.mauricio.ascencio@gmail.com").first()

        if existing:
            # Actualizar
            existing.role = UserRole.SUPERADMIN
            existing.is_active = True
            existing.is_superuser = True
            existing.is_verified = True
            existing.hashed_password = get_password_hash("Admin123!")
            existing.updated_at = datetime.now()
            db.commit()
            print("Usuario actualizado: inge.mauricio.ascencio@gmail.com / Admin123!")
        else:
            # Crear nuevo
            nuevo_admin = User(
                email="inge.mauricio.ascencio@gmail.com",
                hashed_password=get_password_hash("Admin123!"),
                full_name="Mauricio Ascencio",
                role=UserRole.SUPERADMIN,
                client_id="AGENTSAT",
                client_name="AgentSat Portal",
                is_active=True,
                is_superuser=True,
                is_verified=True,
                created_at=datetime.now()
            )
            db.add(nuevo_admin)
            db.commit()
            print("Usuario creado: inge.mauricio.ascencio@gmail.com / Admin123!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    crear_superadmin_automatico()
