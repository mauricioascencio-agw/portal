"""
API endpoints para Catálogos (Clientes y Proveedores)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from typing import Optional
from datetime import datetime
import logging

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole

logger = logging.getLogger('catalogs')

router = APIRouter(prefix="/api/catalogs", tags=["catalogs"])


# ============================================================================
# CLIENTES
# ============================================================================

@router.get("/clients")
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    plan_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar clientes con paginación y filtros
    """
    try:
        # Base query
        where_clauses = ["1=1"]
        params = {}

        if search:
            where_clauses.append("(client_name LIKE :search OR rfc LIKE :search OR razon_social LIKE :search OR email LIKE :search)")
            params["search"] = f"%{search}%"

        if plan_type:
            where_clauses.append("plan_type = :plan_type")
            params["plan_type"] = plan_type

        if is_active is not None:
            where_clauses.append("is_active = :is_active")
            params["is_active"] = is_active

        where_sql = " AND ".join(where_clauses)

        # Count total
        count_query = text(f"SELECT COUNT(*) as total FROM clients WHERE {where_sql}")
        total_result = db.execute(count_query, params).fetchone()
        total = total_result.total if total_result else 0

        # Get data
        data_query = text(f"""
            SELECT id, client_id, client_name, rfc, razon_social, email,
                   plan_type, is_active, created_at, updated_at
            FROM clients
            WHERE {where_sql}
            ORDER BY client_name ASC
            LIMIT :limit OFFSET :skip
        """)
        params["limit"] = limit
        params["skip"] = skip

        results = db.execute(data_query, params).fetchall()

        clients = []
        for row in results:
            clients.append({
                "id": row.id,
                "client_id": row.client_id,
                "client_name": row.client_name,
                "rfc": row.rfc,
                "razon_social": row.razon_social,
                "email": row.email,
                "plan_type": row.plan_type,
                "is_active": bool(row.is_active),
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            })

        return {
            "data": clients,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except Exception as e:
        logger.error(f"Error listing clients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/clients/{client_id}")
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener un cliente por ID
    """
    try:
        query = text("SELECT * FROM clients WHERE id = :id")
        result = db.execute(query, {"id": client_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        return {
            "id": result.id,
            "client_id": result.client_id,
            "client_name": result.client_name,
            "rfc": result.rfc,
            "razon_social": result.razon_social,
            "email": result.email,
            "plan_type": result.plan_type,
            "is_active": bool(result.is_active),
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "updated_at": result.updated_at.isoformat() if result.updated_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/clients")
async def create_client(
    client_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear nuevo cliente
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("""
            INSERT INTO clients (client_id, client_name, rfc, razon_social, email, plan_type, is_active)
            VALUES (:client_id, :client_name, :rfc, :razon_social, :email, :plan_type, :is_active)
        """)

        db.execute(query, {
            "client_id": client_data.get("client_id"),
            "client_name": client_data.get("client_name"),
            "rfc": client_data.get("rfc"),
            "razon_social": client_data.get("razon_social"),
            "email": client_data.get("email"),
            "plan_type": client_data.get("plan_type", "basico"),
            "is_active": client_data.get("is_active", True)
        })
        db.commit()

        return {"message": "Cliente creado exitosamente"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/clients/{client_id}")
async def update_client(
    client_id: int,
    client_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar cliente
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("""
            UPDATE clients SET
                client_name = :client_name,
                rfc = :rfc,
                razon_social = :razon_social,
                email = :email,
                plan_type = :plan_type,
                is_active = :is_active
            WHERE id = :id
        """)

        result = db.execute(query, {
            "id": client_id,
            "client_name": client_data.get("client_name"),
            "rfc": client_data.get("rfc"),
            "razon_social": client_data.get("razon_social"),
            "email": client_data.get("email"),
            "plan_type": client_data.get("plan_type"),
            "is_active": client_data.get("is_active")
        })
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        return {"message": "Cliente actualizado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/clients/{client_id}")
async def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Desactivar cliente (soft delete)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("UPDATE clients SET is_active = 0 WHERE id = :id")
        result = db.execute(query, {"id": client_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        return {"message": "Cliente desactivado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ============================================================================
# PROVEEDORES
# ============================================================================

@router.get("/suppliers")
async def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar proveedores con paginación y filtros
    """
    try:
        where_clauses = ["1=1"]
        params = {}

        # Filtrar por client_id del usuario si no es SUPERADMIN
        if current_user.role != UserRole.SUPERADMIN and current_user.client_id:
            where_clauses.append("client_id = :client_id")
            params["client_id"] = current_user.client_id

        if search:
            where_clauses.append("(razon_social LIKE :search OR rfc LIKE :search OR email LIKE :search OR contact_name LIKE :search)")
            params["search"] = f"%{search}%"

        if is_active is not None:
            where_clauses.append("is_active = :is_active")
            params["is_active"] = is_active

        where_sql = " AND ".join(where_clauses)

        # Count total
        count_query = text(f"SELECT COUNT(*) as total FROM suppliers WHERE {where_sql}")
        total_result = db.execute(count_query, params).fetchone()
        total = total_result.total if total_result else 0

        # Get data
        data_query = text(f"""
            SELECT id, client_id, rfc, razon_social, regimen_fiscal, codigo_postal,
                   email, phone, address, city, state, country,
                   contact_name, contact_position, contact_phone, contact_email,
                   banco, cuenta_bancaria, clabe, is_active, notas,
                   created_at, updated_at
            FROM suppliers
            WHERE {where_sql}
            ORDER BY razon_social ASC
            LIMIT :limit OFFSET :skip
        """)
        params["limit"] = limit
        params["skip"] = skip

        results = db.execute(data_query, params).fetchall()

        suppliers = []
        for row in results:
            suppliers.append({
                "id": row.id,
                "client_id": row.client_id,
                "rfc": row.rfc,
                "razon_social": row.razon_social,
                "regimen_fiscal": row.regimen_fiscal,
                "codigo_postal": row.codigo_postal,
                "email": row.email,
                "phone": row.phone,
                "address": row.address,
                "city": row.city,
                "state": row.state,
                "country": row.country,
                "contact_name": row.contact_name,
                "contact_position": row.contact_position,
                "contact_phone": row.contact_phone,
                "contact_email": row.contact_email,
                "banco": row.banco,
                "cuenta_bancaria": row.cuenta_bancaria,
                "clabe": row.clabe,
                "is_active": bool(row.is_active),
                "notas": row.notas,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            })

        return {
            "data": suppliers,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except Exception as e:
        logger.error(f"Error listing suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/suppliers/{supplier_id}")
async def get_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener un proveedor por ID
    """
    try:
        query = text("SELECT * FROM suppliers WHERE id = :id")
        result = db.execute(query, {"id": supplier_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        return {
            "id": result.id,
            "client_id": result.client_id,
            "rfc": result.rfc,
            "razon_social": result.razon_social,
            "regimen_fiscal": result.regimen_fiscal,
            "codigo_postal": result.codigo_postal,
            "email": result.email,
            "phone": result.phone,
            "address": result.address,
            "city": result.city,
            "state": result.state,
            "country": result.country,
            "contact_name": result.contact_name,
            "contact_position": result.contact_position,
            "contact_phone": result.contact_phone,
            "contact_email": result.contact_email,
            "banco": result.banco,
            "cuenta_bancaria": result.cuenta_bancaria,
            "clabe": result.clabe,
            "is_active": bool(result.is_active),
            "notas": result.notas,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "updated_at": result.updated_at.isoformat() if result.updated_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/suppliers")
async def create_supplier(
    supplier_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear nuevo proveedor
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CONTADOR]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("""
            INSERT INTO suppliers (client_id, rfc, razon_social, regimen_fiscal, codigo_postal,
                                   email, phone, address, city, state, country,
                                   contact_name, contact_position, contact_phone, contact_email,
                                   banco, cuenta_bancaria, clabe, is_active, notas)
            VALUES (:client_id, :rfc, :razon_social, :regimen_fiscal, :codigo_postal,
                    :email, :phone, :address, :city, :state, :country,
                    :contact_name, :contact_position, :contact_phone, :contact_email,
                    :banco, :cuenta_bancaria, :clabe, :is_active, :notas)
        """)

        # Usar client_id del usuario si no es SUPERADMIN
        client_id = supplier_data.get("client_id")
        if current_user.role != UserRole.SUPERADMIN:
            client_id = current_user.client_id

        db.execute(query, {
            "client_id": client_id,
            "rfc": supplier_data.get("rfc"),
            "razon_social": supplier_data.get("razon_social"),
            "regimen_fiscal": supplier_data.get("regimen_fiscal"),
            "codigo_postal": supplier_data.get("codigo_postal"),
            "email": supplier_data.get("email"),
            "phone": supplier_data.get("phone"),
            "address": supplier_data.get("address"),
            "city": supplier_data.get("city"),
            "state": supplier_data.get("state"),
            "country": supplier_data.get("country", "Mexico"),
            "contact_name": supplier_data.get("contact_name"),
            "contact_position": supplier_data.get("contact_position"),
            "contact_phone": supplier_data.get("contact_phone"),
            "contact_email": supplier_data.get("contact_email"),
            "banco": supplier_data.get("banco"),
            "cuenta_bancaria": supplier_data.get("cuenta_bancaria"),
            "clabe": supplier_data.get("clabe"),
            "is_active": supplier_data.get("is_active", True),
            "notas": supplier_data.get("notas")
        })
        db.commit()

        return {"message": "Proveedor creado exitosamente"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: int,
    supplier_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar proveedor
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CONTADOR]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("""
            UPDATE suppliers SET
                rfc = :rfc,
                razon_social = :razon_social,
                regimen_fiscal = :regimen_fiscal,
                codigo_postal = :codigo_postal,
                email = :email,
                phone = :phone,
                address = :address,
                city = :city,
                state = :state,
                country = :country,
                contact_name = :contact_name,
                contact_position = :contact_position,
                contact_phone = :contact_phone,
                contact_email = :contact_email,
                banco = :banco,
                cuenta_bancaria = :cuenta_bancaria,
                clabe = :clabe,
                is_active = :is_active,
                notas = :notas
            WHERE id = :id
        """)

        result = db.execute(query, {
            "id": supplier_id,
            "rfc": supplier_data.get("rfc"),
            "razon_social": supplier_data.get("razon_social"),
            "regimen_fiscal": supplier_data.get("regimen_fiscal"),
            "codigo_postal": supplier_data.get("codigo_postal"),
            "email": supplier_data.get("email"),
            "phone": supplier_data.get("phone"),
            "address": supplier_data.get("address"),
            "city": supplier_data.get("city"),
            "state": supplier_data.get("state"),
            "country": supplier_data.get("country"),
            "contact_name": supplier_data.get("contact_name"),
            "contact_position": supplier_data.get("contact_position"),
            "contact_phone": supplier_data.get("contact_phone"),
            "contact_email": supplier_data.get("contact_email"),
            "banco": supplier_data.get("banco"),
            "cuenta_bancaria": supplier_data.get("cuenta_bancaria"),
            "clabe": supplier_data.get("clabe"),
            "is_active": supplier_data.get("is_active"),
            "notas": supplier_data.get("notas")
        })
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        return {"message": "Proveedor actualizado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Desactivar proveedor (soft delete)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("UPDATE suppliers SET is_active = 0 WHERE id = :id")
        result = db.execute(query, {"id": supplier_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        return {"message": "Proveedor desactivado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/suppliers/{supplier_id}/activate")
async def activate_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activar proveedor
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="No tienes permisos")

    try:
        query = text("UPDATE suppliers SET is_active = 1 WHERE id = :id")
        result = db.execute(query, {"id": supplier_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        return {"message": "Proveedor activado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error activating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
