"""
API endpoints para KPIs y análisis de CFDIs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_, or_
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User

logger = logging.getLogger('kpis')

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("/dashboard")
async def get_dashboard_kpis(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene KPIs principales para el dashboard

    KPIs incluidos:
    - Total de CFDIs
    - Total facturado
    - Promedio por factura
    - Facturas por tipo (Ingreso, Egreso, Traslado, Nómina, Pago)
    - Top 5 clientes/proveedores
    - Tendencia mensual
    - Estado de validación
    """
    try:
        # Filtros de fecha
        fecha_filter = ""
        if fecha_inicio and fecha_fin:
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"
        elif not fecha_inicio and not fecha_fin:
            # Por defecto, últimos 30 días
            fecha_fin_dt = datetime.now()
            fecha_inicio_dt = fecha_fin_dt - timedelta(days=30)
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio_dt.strftime('%Y-%m-%d')}' AND '{fecha_fin_dt.strftime('%Y-%m-%d')}'"

        # KPI 1: Total de CFDIs
        query_total = text(f"""
            SELECT COUNT(*) as total
            FROM cfdi
            WHERE 1=1 {fecha_filter}
        """)
        total_cfdis = db.execute(query_total).fetchone()

        # KPI 2: Total facturado (solo Ingresos)
        query_ingresos = text(f"""
            SELECT
                COALESCE(SUM(total), 0) as total_ingresos,
                COALESCE(AVG(total), 0) as promedio_ingresos
            FROM cfdi
            WHERE tipo_comprobante = 'I' {fecha_filter}
        """)
        ingresos = db.execute(query_ingresos).fetchone()

        # KPI 3: Total de egresos
        query_egresos = text(f"""
            SELECT
                COALESCE(SUM(total), 0) as total_egresos,
                COALESCE(AVG(total), 0) as promedio_egresos
            FROM cfdi
            WHERE tipo_comprobante = 'E' {fecha_filter}
        """)
        egresos = db.execute(query_egresos).fetchone()

        # KPI 4: Distribución por tipo de comprobante
        query_tipos = text(f"""
            SELECT
                tipo_comprobante,
                COUNT(*) as cantidad,
                SUM(total) as monto_total
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY tipo_comprobante
        """)
        tipos_comprobante = db.execute(query_tipos).fetchall()

        tipos_map = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'T': 'Traslado',
            'N': 'Nómina',
            'P': 'Pago'
        }

        distribucion_tipos = [
            {
                "tipo": tipos_map.get(row.tipo_comprobante, row.tipo_comprobante),
                "codigo": row.tipo_comprobante,
                "cantidad": row.cantidad,
                "monto": float(row.monto_total) if row.monto_total else 0
            }
            for row in tipos_comprobante
        ]

        # KPI 5: Top 5 clientes (receptores de facturas de ingreso)
        query_clientes = text(f"""
            SELECT
                receptor_rfc,
                receptor_nombre,
                COUNT(*) as num_facturas,
                SUM(total) as total_facturado
            FROM cfdi
            WHERE tipo_comprobante = 'I' {fecha_filter}
            GROUP BY receptor_rfc, receptor_nombre
            ORDER BY total_facturado DESC
            LIMIT 5
        """)
        top_clientes = db.execute(query_clientes).fetchall()

        # KPI 6: Top 5 proveedores (emisores de facturas de egreso)
        query_proveedores = text(f"""
            SELECT
                emisor_rfc,
                emisor_nombre,
                COUNT(*) as num_facturas,
                SUM(total) as total_pagado
            FROM cfdi
            WHERE tipo_comprobante = 'E' {fecha_filter}
            GROUP BY emisor_rfc, emisor_nombre
            ORDER BY total_pagado DESC
            LIMIT 5
        """)
        top_proveedores = db.execute(query_proveedores).fetchall()

        # KPI 7: Tendencia mensual (últimos 6 meses)
        query_tendencia = text(f"""
            SELECT
                DATE_FORMAT(fecha, '%Y-%m') as mes,
                tipo_comprobante,
                COUNT(*) as cantidad,
                SUM(total) as monto
            FROM cfdi
            WHERE fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha, '%Y-%m'), tipo_comprobante
            ORDER BY mes DESC
        """)
        tendencia = db.execute(query_tendencia).fetchall()

        # Organizar tendencia por mes
        tendencia_dict = {}
        for row in tendencia:
            if row.mes not in tendencia_dict:
                tendencia_dict[row.mes] = {
                    'mes': row.mes,
                    'ingresos': 0,
                    'egresos': 0,
                    'cantidad_ingresos': 0,
                    'cantidad_egresos': 0
                }

            if row.tipo_comprobante == 'I':
                tendencia_dict[row.mes]['ingresos'] = float(row.monto) if row.monto else 0
                tendencia_dict[row.mes]['cantidad_ingresos'] = row.cantidad
            elif row.tipo_comprobante == 'E':
                tendencia_dict[row.mes]['egresos'] = float(row.monto) if row.monto else 0
                tendencia_dict[row.mes]['cantidad_egresos'] = row.cantidad

        # KPI 8: Estado de validación
        query_validacion = text(f"""
            SELECT
                estatus_validacion,
                COUNT(*) as cantidad
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY estatus_validacion
        """)
        validacion = db.execute(query_validacion).fetchall()

        # KPI 9: Formas de pago más usadas
        query_formas_pago = text(f"""
            SELECT
                forma_pago,
                COUNT(*) as cantidad,
                SUM(total) as monto_total
            FROM cfdi
            WHERE forma_pago IS NOT NULL {fecha_filter}
            GROUP BY forma_pago
            ORDER BY cantidad DESC
            LIMIT 5
        """)
        formas_pago = db.execute(query_formas_pago).fetchall()

        return {
            "periodo": {
                "fecha_inicio": fecha_inicio or (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                "fecha_fin": fecha_fin or datetime.now().strftime('%Y-%m-%d')
            },
            "resumen_general": {
                "total_cfdis": total_cfdis.total if total_cfdis else 0,
                "total_ingresos": float(ingresos.total_ingresos) if ingresos and ingresos.total_ingresos else 0,
                "promedio_ingresos": float(ingresos.promedio_ingresos) if ingresos and ingresos.promedio_ingresos else 0,
                "total_egresos": float(egresos.total_egresos) if egresos and egresos.total_egresos else 0,
                "promedio_egresos": float(egresos.promedio_egresos) if egresos and egresos.promedio_egresos else 0,
                "utilidad": float(ingresos.total_ingresos or 0) - float(egresos.total_egresos or 0)
            },
            "distribucion_tipos": distribucion_tipos,
            "top_clientes": [
                {
                    "rfc": row.receptor_rfc,
                    "nombre": row.receptor_nombre,
                    "num_facturas": row.num_facturas,
                    "total": float(row.total_facturado) if row.total_facturado else 0
                }
                for row in top_clientes
            ],
            "top_proveedores": [
                {
                    "rfc": row.emisor_rfc,
                    "nombre": row.emisor_nombre,
                    "num_facturas": row.num_facturas,
                    "total": float(row.total_pagado) if row.total_pagado else 0
                }
                for row in top_proveedores
            ],
            "tendencia_mensual": sorted(list(tendencia_dict.values()), key=lambda x: x['mes']),
            "estado_validacion": [
                {
                    "estado": row.estatus_validacion,
                    "cantidad": row.cantidad
                }
                for row in validacion
            ],
            "formas_pago": [
                {
                    "forma_pago": row.forma_pago,
                    "cantidad": row.cantidad,
                    "monto_total": float(row.monto_total) if row.monto_total else 0
                }
                for row in formas_pago
            ]
        }

    except Exception as e:
        logger.error(f"Error al obtener KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al obtener KPIs: {str(e)}")


@router.get("/detalle-periodo")
async def get_detalle_periodo(
    periodo: str = Query(..., description="Formato: YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene detalles de un período específico
    """
    try:
        query = text(f"""
            SELECT
                DATE(fecha) as dia,
                tipo_comprobante,
                COUNT(*) as cantidad,
                SUM(total) as monto
            FROM cfdi
            WHERE DATE_FORMAT(fecha, '%Y-%m') = :periodo
            GROUP BY DATE(fecha), tipo_comprobante
            ORDER BY dia
        """)

        resultado = db.execute(query, {"periodo": periodo}).fetchall()

        # Organizar por día
        detalle_dict = {}
        for row in resultado:
            dia_str = row.dia.strftime('%Y-%m-%d')
            if dia_str not in detalle_dict:
                detalle_dict[dia_str] = {
                    'fecha': dia_str,
                    'ingresos': 0,
                    'egresos': 0,
                    'cantidad': 0
                }

            if row.tipo_comprobante == 'I':
                detalle_dict[dia_str]['ingresos'] = float(row.monto) if row.monto else 0
            elif row.tipo_comprobante == 'E':
                detalle_dict[dia_str]['egresos'] = float(row.monto) if row.monto else 0

            detalle_dict[dia_str]['cantidad'] += row.cantidad

        return {
            "periodo": periodo,
            "detalle_diario": sorted(list(detalle_dict.values()), key=lambda x: x['fecha'])
        }

    except Exception as e:
        logger.error(f"Error al obtener detalle de período: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
