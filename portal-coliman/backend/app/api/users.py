# -*- coding: utf-8 -*-
"""
API para CRUD de Usuarios

Este módulo implementa las operaciones CRUD (Create, Read, Update, Delete)
para la gestión de usuarios del sistema.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserCreate, UserUpdate, PasswordChange
from app.core.security import (
    get_current_user,
    get_password_hash,
    verify_password
)

router = APIRouter(prefix="/api/users", tags=["Usuarios"])


# ============================================================================
# ENDPOINTS DE PERFIL (deben ir ANTES de los endpoints con parámetros)
# ============================================================================

@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Obtener perfil del usuario actual
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if current_user.role else None,
        "client_id": current_user.client_id,
        "client_name": current_user.client_name,
        "phone": current_user.phone,
        "company": current_user.company,
        "position": current_user.position,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }


# ============================================================================
# ENDPOINTS CRUD
# ============================================================================

@router.get("/", response_model=dict)
async def list_users(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Límite de registros"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    role: Optional[UserRole] = Query(None, description="Filtrar por rol"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    client_id: Optional[str] = Query(None, description="Filtrar por cliente"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar usuarios con paginación y filtros

    Solo usuarios con rol ADMIN o SUPERADMIN pueden listar usuarios
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar usuarios"
        )

    # Query base
    query = db.query(User)

    # Si no es SUPERADMIN, solo ve usuarios de su mismo cliente
    if current_user.role != UserRole.SUPERADMIN:
        query = query.filter(User.client_id == current_user.client_id)

    # Filtros
    if search:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.company.ilike(f"%{search}%")
            )
        )

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if client_id:
        query = query.filter(User.client_id == client_id)

    # Contar total
    total = query.count()

    # Paginación y ordenamiento
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    # Convertir a dict para serialización
    users_data = []
    for user in users:
        users_data.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if user.role else None,
            "client_id": user.client_id,
            "client_name": user.client_name,
            "phone": user.phone,
            "company": user.company,
            "position": user.position,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        })

    return {
        "data": users_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener un usuario por ID

    Los usuarios pueden ver su propio perfil.
    ADMIN y SUPERADMIN pueden ver otros usuarios.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Verificar permisos
    if current_user.id != user_id:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este usuario"
            )

        # ADMIN solo puede ver usuarios de su mismo cliente
        if current_user.role == UserRole.ADMIN and user.client_id != current_user.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este usuario"
            )

    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear nuevo usuario

    Solo ADMIN y SUPERADMIN pueden crear usuarios
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios"
        )

    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Si es ADMIN, asignar su mismo client_id
    if current_user.role == UserRole.ADMIN:
        user_data.client_id = current_user.client_id
        user_data.client_name = current_user.client_name

        # ADMIN no puede crear SUPERADMIN
        if user_data.role == UserRole.SUPERADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes crear usuarios con rol SUPERADMIN"
            )

    # Crear usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        client_id=user_data.client_id,
        client_name=user_data.client_name,
        phone=user_data.phone,
        company=user_data.company,
        position=user_data.position,
        is_active=True,
        is_verified=True  # Auto-verificado cuando es creado por admin
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar usuario

    Los usuarios pueden actualizar su propio perfil (datos limitados).
    ADMIN y SUPERADMIN pueden actualizar otros usuarios.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Verificar permisos
    is_own_profile = current_user.id == user_id
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]

    if not is_own_profile and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )

    # ADMIN solo puede actualizar usuarios de su mismo cliente
    if current_user.role == UserRole.ADMIN and user.client_id != current_user.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )

    # Usuarios normales solo pueden actualizar ciertos campos
    if not is_admin:
        allowed_fields = {'full_name', 'phone', 'company', 'position'}
        update_dict = user_data.dict(exclude_unset=True)
        for field in update_dict.keys():
            if field not in allowed_fields:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No puedes actualizar el campo '{field}'"
                )

    # Actualizar campos
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar usuario (soft delete - desactivar)

    Solo ADMIN y SUPERADMIN pueden eliminar usuarios
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # No se puede eliminar a sí mismo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )

    # ADMIN solo puede eliminar usuarios de su mismo cliente
    if current_user.role == UserRole.ADMIN and user.client_id != current_user.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este usuario"
        )

    # Soft delete: desactivar en lugar de eliminar
    user.is_active = False
    db.commit()

    return None


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activar usuario desactivado

    Solo ADMIN y SUPERADMIN pueden activar usuarios
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para activar usuarios"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # ADMIN solo puede activar usuarios de su mismo cliente
    if current_user.role == UserRole.ADMIN and user.client_id != current_user.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para activar este usuario"
        )

    user.is_active = True
    db.commit()
    db.refresh(user)

    return user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual
    """
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )

    # Actualizar contraseña
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Contraseña actualizada exitosamente"}


@router.get("/stats/summary", response_model=dict)
async def get_users_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener estadísticas de usuarios

    Solo ADMIN y SUPERADMIN
    """
    # Verificar permisos
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver estadísticas"
        )

    # Query base
    query = db.query(User)

    # Si no es SUPERADMIN, solo ve usuarios de su mismo cliente
    if current_user.role != UserRole.SUPERADMIN:
        query = query.filter(User.client_id == current_user.client_id)

    total_users = query.count()
    active_users = query.filter(User.is_active == True).count()
    inactive_users = query.filter(User.is_active == False).count()

    # Por rol
    users_by_role = {}
    for role in UserRole:
        count = query.filter(User.role == role).count()
        users_by_role[role.value] = count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "users_by_role": users_by_role
    }
