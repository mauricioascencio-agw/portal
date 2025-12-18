"""
API endpoints para generación de reportes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User

logger = logging.getLogger('reports')

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/fiscal")
async def get_reporte_fiscal(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genera reporte fiscal detallado con:
    - Resumen de ingresos y egresos
    - Desglose de impuestos
    - Listado de facturas por tipo
    - Totales por RFC emisor/receptor
    """
    try:
        # Filtros de fecha
        fecha_filter = ""
        if fecha_inicio and fecha_fin:
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"
        else:
            # Por defecto, mes actual
            hoy = datetime.now()
            fecha_inicio = hoy.replace(day=1).strftime('%Y-%m-%d')
            fecha_fin = hoy.strftime('%Y-%m-%d')
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"

        # Resumen general
        query_resumen = text(f"""
            SELECT
                tipo_comprobante,
                COUNT(*) as cantidad,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(descuento), 0) as descuento,
                COALESCE(SUM(total), 0) as total,
                COALESCE(SUM(total_impuestos_trasladados), 0) as iva_trasladado,
                COALESCE(SUM(total_impuestos_retenidos), 0) as isr_retenido
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY tipo_comprobante
        """)
        resumen = db.execute(query_resumen).fetchall()

        tipos_map = {
            'I': 'Ingresos',
            'E': 'Egresos',
            'T': 'Traslados',
            'N': 'Nómina',
            'P': 'Pagos'
        }

        resumen_por_tipo = []
        total_ingresos = 0
        total_egresos = 0
        total_iva = 0
        total_isr = 0

        for row in resumen:
            tipo_data = {
                "tipo": tipos_map.get(row.tipo_comprobante, row.tipo_comprobante),
                "codigo": row.tipo_comprobante,
                "cantidad": row.cantidad,
                "subtotal": float(row.subtotal),
                "descuento": float(row.descuento),
                "total": float(row.total),
                "iva_trasladado": float(row.iva_trasladado),
                "isr_retenido": float(row.isr_retenido)
            }
            resumen_por_tipo.append(tipo_data)

            if row.tipo_comprobante == 'I':
                total_ingresos = float(row.total)
            elif row.tipo_comprobante == 'E':
                total_egresos = float(row.total)

            total_iva += float(row.iva_trasladado)
            total_isr += float(row.isr_retenido)

        # Desglose por emisor (para egresos)
        query_emisores = text(f"""
            SELECT
                emisor_rfc,
                emisor_nombre,
                emisor_regimen,
                COUNT(*) as num_facturas,
                SUM(subtotal) as subtotal,
                SUM(total) as total,
                SUM(total_impuestos_trasladados) as iva
            FROM cfdi
            WHERE tipo_comprobante = 'E' {fecha_filter}
            GROUP BY emisor_rfc, emisor_nombre, emisor_regimen
            ORDER BY total DESC
        """)
        emisores = db.execute(query_emisores).fetchall()

        # Desglose por receptor (para ingresos)
        query_receptores = text(f"""
            SELECT
                receptor_rfc,
                receptor_nombre,
                receptor_uso_cfdi,
                COUNT(*) as num_facturas,
                SUM(subtotal) as subtotal,
                SUM(total) as total,
                SUM(total_impuestos_trasladados) as iva
            FROM cfdi
            WHERE tipo_comprobante = 'I' {fecha_filter}
            GROUP BY receptor_rfc, receptor_nombre, receptor_uso_cfdi
            ORDER BY total DESC
        """)
        receptores = db.execute(query_receptores).fetchall()

        # Listado detallado de facturas
        query_facturas = text(f"""
            SELECT
                uuid,
                tipo_comprobante,
                serie,
                folio,
                fecha,
                emisor_rfc,
                emisor_nombre,
                receptor_rfc,
                receptor_nombre,
                subtotal,
                descuento,
                total,
                total_impuestos_trasladados,
                total_impuestos_retenidos,
                moneda,
                metodo_pago,
                forma_pago,
                estatus_validacion
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            ORDER BY fecha DESC
            LIMIT 100
        """)
        facturas = db.execute(query_facturas).fetchall()

        return {
            "titulo": "Reporte Fiscal",
            "periodo": {
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            },
            "generado_en": datetime.now().isoformat(),
            "generado_por": current_user.email,
            "resumen_general": {
                "total_ingresos": total_ingresos,
                "total_egresos": total_egresos,
                "utilidad_bruta": total_ingresos - total_egresos,
                "total_iva_trasladado": total_iva,
                "total_isr_retenido": total_isr
            },
            "resumen_por_tipo": resumen_por_tipo,
            "desglose_emisores": [
                {
                    "rfc": row.emisor_rfc,
                    "nombre": row.emisor_nombre,
                    "regimen": row.emisor_regimen,
                    "num_facturas": row.num_facturas,
                    "subtotal": float(row.subtotal) if row.subtotal else 0,
                    "total": float(row.total) if row.total else 0,
                    "iva": float(row.iva) if row.iva else 0
                }
                for row in emisores
            ],
            "desglose_receptores": [
                {
                    "rfc": row.receptor_rfc,
                    "nombre": row.receptor_nombre,
                    "uso_cfdi": row.receptor_uso_cfdi,
                    "num_facturas": row.num_facturas,
                    "subtotal": float(row.subtotal) if row.subtotal else 0,
                    "total": float(row.total) if row.total else 0,
                    "iva": float(row.iva) if row.iva else 0
                }
                for row in receptores
            ],
            "facturas": [
                {
                    "uuid": row.uuid,
                    "tipo": tipos_map.get(row.tipo_comprobante, row.tipo_comprobante),
                    "serie": row.serie,
                    "folio": row.folio,
                    "fecha": row.fecha.isoformat() if row.fecha else None,
                    "emisor_rfc": row.emisor_rfc,
                    "emisor_nombre": row.emisor_nombre,
                    "receptor_rfc": row.receptor_rfc,
                    "receptor_nombre": row.receptor_nombre,
                    "subtotal": float(row.subtotal) if row.subtotal else 0,
                    "descuento": float(row.descuento) if row.descuento else 0,
                    "total": float(row.total) if row.total else 0,
                    "iva": float(row.total_impuestos_trasladados) if row.total_impuestos_trasladados else 0,
                    "isr": float(row.total_impuestos_retenidos) if row.total_impuestos_retenidos else 0,
                    "moneda": row.moneda,
                    "metodo_pago": row.metodo_pago,
                    "forma_pago": row.forma_pago,
                    "estatus": row.estatus_validacion
                }
                for row in facturas
            ]
        }

    except Exception as e:
        logger.error(f"Error al generar reporte fiscal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar reporte: {str(e)}")


@router.get("/ejecutivo")
async def get_reporte_ejecutivo(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genera reporte ejecutivo con:
    - KPIs principales
    - Comparativa con período anterior
    - Tendencias
    - Análisis de clientes y proveedores
    """
    try:
        # Definir período actual
        if fecha_inicio and fecha_fin:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
            fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
        else:
            fecha_fin_dt = datetime.now()
            fecha_inicio_dt = fecha_fin_dt - timedelta(days=30)
            fecha_inicio = fecha_inicio_dt.strftime('%Y-%m-%d')
            fecha_fin = fecha_fin_dt.strftime('%Y-%m-%d')

        # Calcular período anterior (misma duración)
        duracion = (fecha_fin_dt - fecha_inicio_dt).days
        fecha_inicio_anterior = (fecha_inicio_dt - timedelta(days=duracion + 1)).strftime('%Y-%m-%d')
        fecha_fin_anterior = (fecha_inicio_dt - timedelta(days=1)).strftime('%Y-%m-%d')

        fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"
        fecha_filter_anterior = f"AND fecha BETWEEN '{fecha_inicio_anterior}' AND '{fecha_fin_anterior}'"

        # KPIs período actual
        query_actual = text(f"""
            SELECT
                COUNT(*) as total_cfdis,
                COALESCE(SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END), 0) as ingresos,
                COALESCE(SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END), 0) as egresos,
                COALESCE(AVG(CASE WHEN tipo_comprobante = 'I' THEN total END), 0) as ticket_promedio,
                COUNT(DISTINCT receptor_rfc) as clientes_unicos,
                COUNT(DISTINCT emisor_rfc) as proveedores_unicos
            FROM cfdi
            WHERE 1=1 {fecha_filter}
        """)
        actual = db.execute(query_actual).fetchone()

        # KPIs período anterior
        query_anterior = text(f"""
            SELECT
                COUNT(*) as total_cfdis,
                COALESCE(SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END), 0) as ingresos,
                COALESCE(SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END), 0) as egresos
            FROM cfdi
            WHERE 1=1 {fecha_filter_anterior}
        """)
        anterior = db.execute(query_anterior).fetchone()

        # Calcular variaciones
        def calcular_variacion(actual_val, anterior_val):
            if anterior_val and anterior_val > 0:
                return round(((actual_val - anterior_val) / anterior_val) * 100, 2)
            return 0

        # Tendencia diaria del período
        query_tendencia = text(f"""
            SELECT
                DATE(fecha) as dia,
                SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END) as ingresos,
                SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END) as egresos,
                COUNT(*) as cantidad
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY DATE(fecha)
            ORDER BY dia
        """)
        tendencia = db.execute(query_tendencia).fetchall()

        # Top clientes
        query_clientes = text(f"""
            SELECT
                receptor_rfc,
                receptor_nombre,
                COUNT(*) as num_facturas,
                SUM(total) as total_facturado,
                AVG(total) as promedio
            FROM cfdi
            WHERE tipo_comprobante = 'I' {fecha_filter}
            GROUP BY receptor_rfc, receptor_nombre
            ORDER BY total_facturado DESC
            LIMIT 10
        """)
        clientes = db.execute(query_clientes).fetchall()

        # Distribución por estatus
        query_estatus = text(f"""
            SELECT
                estatus_validacion,
                COUNT(*) as cantidad,
                SUM(total) as monto
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY estatus_validacion
        """)
        estatus = db.execute(query_estatus).fetchall()

        ingresos_actual = float(actual.ingresos) if actual.ingresos else 0
        egresos_actual = float(actual.egresos) if actual.egresos else 0
        ingresos_anterior = float(anterior.ingresos) if anterior.ingresos else 0
        egresos_anterior = float(anterior.egresos) if anterior.egresos else 0

        return {
            "titulo": "Reporte Ejecutivo",
            "periodo": {
                "actual": {
                    "fecha_inicio": fecha_inicio,
                    "fecha_fin": fecha_fin
                },
                "anterior": {
                    "fecha_inicio": fecha_inicio_anterior,
                    "fecha_fin": fecha_fin_anterior
                }
            },
            "generado_en": datetime.now().isoformat(),
            "generado_por": current_user.email,
            "kpis": {
                "total_cfdis": {
                    "valor": actual.total_cfdis if actual.total_cfdis else 0,
                    "anterior": anterior.total_cfdis if anterior.total_cfdis else 0,
                    "variacion": calcular_variacion(actual.total_cfdis or 0, anterior.total_cfdis or 0)
                },
                "ingresos": {
                    "valor": ingresos_actual,
                    "anterior": ingresos_anterior,
                    "variacion": calcular_variacion(ingresos_actual, ingresos_anterior)
                },
                "egresos": {
                    "valor": egresos_actual,
                    "anterior": egresos_anterior,
                    "variacion": calcular_variacion(egresos_actual, egresos_anterior)
                },
                "utilidad": {
                    "valor": ingresos_actual - egresos_actual,
                    "anterior": ingresos_anterior - egresos_anterior,
                    "variacion": calcular_variacion(
                        ingresos_actual - egresos_actual,
                        ingresos_anterior - egresos_anterior
                    )
                },
                "ticket_promedio": {
                    "valor": float(actual.ticket_promedio) if actual.ticket_promedio else 0
                },
                "clientes_unicos": {
                    "valor": actual.clientes_unicos if actual.clientes_unicos else 0
                },
                "proveedores_unicos": {
                    "valor": actual.proveedores_unicos if actual.proveedores_unicos else 0
                }
            },
            "tendencia_diaria": [
                {
                    "fecha": row.dia.strftime('%Y-%m-%d'),
                    "ingresos": float(row.ingresos) if row.ingresos else 0,
                    "egresos": float(row.egresos) if row.egresos else 0,
                    "cantidad": row.cantidad
                }
                for row in tendencia
            ],
            "top_clientes": [
                {
                    "rfc": row.receptor_rfc,
                    "nombre": row.receptor_nombre,
                    "num_facturas": row.num_facturas,
                    "total": float(row.total_facturado) if row.total_facturado else 0,
                    "promedio": float(row.promedio) if row.promedio else 0
                }
                for row in clientes
            ],
            "estado_validacion": [
                {
                    "estado": row.estatus_validacion,
                    "cantidad": row.cantidad,
                    "monto": float(row.monto) if row.monto else 0
                }
                for row in estatus
            ]
        }

    except Exception as e:
        logger.error(f"Error al generar reporte ejecutivo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar reporte: {str(e)}")


@router.get("/conciliacion")
async def get_reporte_conciliacion(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genera reporte de conciliación:
    - Comparativa de movimientos
    - Facturas pendientes de validación
    - Análisis de discrepancias
    - Resumen de formas de pago
    """
    try:
        # Filtros de fecha
        if fecha_inicio and fecha_fin:
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"
        else:
            hoy = datetime.now()
            fecha_inicio = hoy.replace(day=1).strftime('%Y-%m-%d')
            fecha_fin = hoy.strftime('%Y-%m-%d')
            fecha_filter = f"AND fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"

        # Resumen por forma de pago
        query_formas = text(f"""
            SELECT
                COALESCE(forma_pago, 'Sin especificar') as forma_pago,
                COUNT(*) as cantidad,
                SUM(total) as monto_total,
                tipo_comprobante
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY forma_pago, tipo_comprobante
            ORDER BY monto_total DESC
        """)
        formas = db.execute(query_formas).fetchall()

        # Facturas pendientes de validación
        query_pendientes = text(f"""
            SELECT
                uuid,
                tipo_comprobante,
                serie,
                folio,
                fecha,
                emisor_rfc,
                emisor_nombre,
                receptor_rfc,
                receptor_nombre,
                total,
                estatus_validacion,
                created_at
            FROM cfdi
            WHERE estatus_validacion = 'pendiente' {fecha_filter}
            ORDER BY fecha DESC
        """)
        pendientes = db.execute(query_pendientes).fetchall()

        # Resumen por método de pago
        query_metodos = text(f"""
            SELECT
                COALESCE(metodo_pago, 'Sin especificar') as metodo_pago,
                COUNT(*) as cantidad,
                SUM(total) as monto_total
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY metodo_pago
            ORDER BY cantidad DESC
        """)
        metodos = db.execute(query_metodos).fetchall()

        # Resumen diario para conciliación
        query_diario = text(f"""
            SELECT
                DATE(fecha) as dia,
                COUNT(*) as num_facturas,
                SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END) as ingresos,
                SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END) as egresos,
                SUM(CASE WHEN estatus_validacion = 'valido' THEN 1 ELSE 0 END) as validadas,
                SUM(CASE WHEN estatus_validacion = 'pendiente' THEN 1 ELSE 0 END) as pendientes
            FROM cfdi
            WHERE 1=1 {fecha_filter}
            GROUP BY DATE(fecha)
            ORDER BY dia
        """)
        diario = db.execute(query_diario).fetchall()

        # Calcular totales
        total_facturas = sum(row.num_facturas for row in diario)
        total_ingresos = sum(float(row.ingresos) if row.ingresos else 0 for row in diario)
        total_egresos = sum(float(row.egresos) if row.egresos else 0 for row in diario)
        total_validadas = sum(row.validadas for row in diario)
        total_pendientes_count = sum(row.pendientes for row in diario)

        tipos_map = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'T': 'Traslado',
            'N': 'Nómina',
            'P': 'Pago'
        }

        formas_pago_map = {
            '01': 'Efectivo',
            '02': 'Cheque nominativo',
            '03': 'Transferencia electrónica',
            '04': 'Tarjeta de crédito',
            '28': 'Tarjeta de débito',
            '99': 'Por definir'
        }

        metodos_pago_map = {
            'PUE': 'Pago en Una sola Exhibición',
            'PPD': 'Pago en Parcialidades o Diferido'
        }

        return {
            "titulo": "Reporte de Conciliación",
            "periodo": {
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            },
            "generado_en": datetime.now().isoformat(),
            "generado_por": current_user.email,
            "resumen": {
                "total_facturas": total_facturas,
                "total_ingresos": total_ingresos,
                "total_egresos": total_egresos,
                "saldo_neto": total_ingresos - total_egresos,
                "facturas_validadas": total_validadas,
                "facturas_pendientes": total_pendientes_count,
                "porcentaje_validacion": round((total_validadas / total_facturas * 100), 2) if total_facturas > 0 else 0
            },
            "formas_pago": [
                {
                    "codigo": row.forma_pago,
                    "nombre": formas_pago_map.get(row.forma_pago, row.forma_pago),
                    "tipo": tipos_map.get(row.tipo_comprobante, row.tipo_comprobante),
                    "cantidad": row.cantidad,
                    "monto": float(row.monto_total) if row.monto_total else 0
                }
                for row in formas
            ],
            "metodos_pago": [
                {
                    "codigo": row.metodo_pago,
                    "nombre": metodos_pago_map.get(row.metodo_pago, row.metodo_pago),
                    "cantidad": row.cantidad,
                    "monto": float(row.monto_total) if row.monto_total else 0
                }
                for row in metodos
            ],
            "movimientos_diarios": [
                {
                    "fecha": row.dia.strftime('%Y-%m-%d'),
                    "num_facturas": row.num_facturas,
                    "ingresos": float(row.ingresos) if row.ingresos else 0,
                    "egresos": float(row.egresos) if row.egresos else 0,
                    "saldo": (float(row.ingresos) if row.ingresos else 0) - (float(row.egresos) if row.egresos else 0),
                    "validadas": row.validadas,
                    "pendientes": row.pendientes
                }
                for row in diario
            ],
            "facturas_pendientes": [
                {
                    "uuid": row.uuid,
                    "tipo": tipos_map.get(row.tipo_comprobante, row.tipo_comprobante),
                    "serie": row.serie,
                    "folio": row.folio,
                    "fecha": row.fecha.isoformat() if row.fecha else None,
                    "emisor_rfc": row.emisor_rfc,
                    "emisor_nombre": row.emisor_nombre,
                    "receptor_rfc": row.receptor_rfc,
                    "receptor_nombre": row.receptor_nombre,
                    "total": float(row.total) if row.total else 0,
                    "dias_pendiente": (datetime.now() - row.created_at).days if row.created_at else 0
                }
                for row in pendientes
            ]
        }

    except Exception as e:
        logger.error(f"Error al generar reporte de conciliación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al generar reporte: {str(e)}")
