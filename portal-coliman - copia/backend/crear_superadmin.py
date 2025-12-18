#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para crear un usuario SUPERADMIN en Portal AgentSat

Ejecuta este script para crear un usuario administrador inicial.
"""

import sys
import os

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def crear_superadmin():
    """Crear usuario superadmin"""

    # Crear sesión
    db = SessionLocal()

    try:
        # Verificar si ya existe un superadmin
        existing = db.query(User).filter(User.email == "admin@agentsat.com").first()

        if existing:
            print("❌ Ya existe un usuario con el email admin@agentsat.com")
            print(f"   ID: {existing.id}")
            print(f"   Nombre: {existing.full_name}")
            print(f"   Rol: {existing.role}")
            print(f"   Activo: {existing.is_active}")

            respuesta = input("\n¿Deseas actualizar este usuario? (s/n): ")
            if respuesta.lower() != 's':
                print("Operación cancelada.")
                return

            # Actualizar usuario existente
            existing.role = UserRole.SUPERADMIN
            existing.is_active = True
            existing.is_superuser = True
            existing.is_verified = True

            # Actualizar contraseña
            nueva_password = input("Ingresa la nueva contraseña (mínimo 8 caracteres): ")
            if len(nueva_password) < 8:
                print("❌ La contraseña debe tener al menos 8 caracteres")
                return

            existing.hashed_password = get_password_hash(nueva_password)
            existing.updated_at = datetime.now()

            db.commit()

            print("\n✅ Usuario actualizado exitosamente!")
            print(f"   Email: {existing.email}")
            print(f"   Contraseña: {nueva_password}")
            print(f"   Rol: SUPERADMIN")

        else:
            # Solicitar datos
            print("\n=== CREAR USUARIO SUPERADMIN ===\n")

            full_name = input("Nombre completo [Administrador del Sistema]: ") or "Administrador del Sistema"
            email = input("Email [admin@agentsat.com]: ") or "admin@agentsat.com"
            password = input("Contraseña [Admin123!]: ") or "Admin123!"

            if len(password) < 8:
                print("❌ La contraseña debe tener al menos 8 caracteres")
                return

            # Crear nuevo usuario
            nuevo_admin = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=UserRole.SUPERADMIN,
                client_id="AGENTSAT",
                client_name="AgentSat Portal",
                is_active=True,
                is_superuser=True,
                is_verified=True,
                phone="+52 123 456 7890",
                company="AGENTSAT",
                position="Super Administrador",
                created_at=datetime.now()
            )

            db.add(nuevo_admin)
            db.commit()
            db.refresh(nuevo_admin)

            print("\n✅ Usuario SUPERADMIN creado exitosamente!")
            print(f"   ID: {nuevo_admin.id}")
            print(f"   Email: {email}")
            print(f"   Contraseña: {password}")
            print(f"   Nombre: {full_name}")
            print(f"   Rol: SUPERADMIN")

        print("\n📝 IMPORTANTE:")
        print("   1. Guarda estas credenciales en un lugar seguro")
        print("   2. Cambia la contraseña después del primer login")
        print("   3. Usa este usuario para crear otros usuarios desde el panel web")
        print(f"\n🌐 Accede al sistema en: http://localhost:3000")

    except Exception as e:
        print(f"\n❌ Error al crear superadmin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🚀 Portal AgentSat - Crear Superadmin\n")
    crear_superadmin()
