"""
API endpoints para el MCP Agent - Asistente IA
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
import logging
import httpx
from datetime import datetime, timedelta

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User

logger = logging.getLogger('mcp_agent')

router = APIRouter(prefix="/api/mcp", tags=["MCP Agent"])


class ChatRequest(BaseModel):
    mensaje: str
    contexto: Optional[str] = None


class ChatResponse(BaseModel):
    respuesta: str
    datos: Optional[dict] = None
    tipo: str = "text"


def get_cfdi_context(db: Session, client_id: str = "COLIMAN001") -> str:
    """Obtiene contexto de CFDIs para el agente"""
    try:
        # Estadísticas generales
        query_stats = text("""
            SELECT
                COUNT(*) as total_cfdis,
                COALESCE(SUM(total), 0) as monto_total,
                COUNT(DISTINCT emisor_rfc) as emisores_unicos,
                COUNT(DISTINCT receptor_rfc) as receptores_unicos,
                MIN(fecha) as fecha_mas_antigua,
                MAX(fecha) as fecha_mas_reciente,
                SUM(CASE WHEN estatus_validacion = 'valido' THEN 1 ELSE 0 END) as validos,
                SUM(CASE WHEN estatus_validacion = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estatus_validacion = 'rechazado' THEN 1 ELSE 0 END) as rechazados
            FROM cfdi
            WHERE client_id = :client_id
        """)
        stats = db.execute(query_stats, {"client_id": client_id}).fetchone()

        # Top emisores
        query_top_emisores = text("""
            SELECT emisor_nombre, emisor_rfc, COUNT(*) as num_facturas, SUM(total) as total
            FROM cfdi
            WHERE client_id = :client_id
            GROUP BY emisor_nombre, emisor_rfc
            ORDER BY total DESC
            LIMIT 5
        """)
        top_emisores = db.execute(query_top_emisores, {"client_id": client_id}).fetchall()

        # Resumen por tipo
        query_tipos = text("""
            SELECT tipo_comprobante, COUNT(*) as cantidad, SUM(total) as total
            FROM cfdi
            WHERE client_id = :client_id
            GROUP BY tipo_comprobante
        """)
        tipos = db.execute(query_tipos, {"client_id": client_id}).fetchall()

        contexto = f"""
DATOS DE CFDIs EN EL SISTEMA:
- Total de CFDIs: {stats.total_cfdis}
- Monto Total: ${float(stats.monto_total):,.2f} MXN
- Emisores únicos: {stats.emisores_unicos}
- Receptores únicos: {stats.receptores_unicos}
- Fecha más antigua: {stats.fecha_mas_antigua}
- Fecha más reciente: {stats.fecha_mas_reciente}
- Validados: {stats.validos}
- Pendientes: {stats.pendientes}
- Rechazados: {stats.rechazados}

TOP 5 PROVEEDORES (por monto facturado):
"""
        for i, e in enumerate(top_emisores, 1):
            contexto += f"{i}. {e.emisor_nombre} ({e.emisor_rfc}): {e.num_facturas} facturas por ${float(e.total):,.2f}\n"

        contexto += "\nRESUMEN POR TIPO DE COMPROBANTE:\n"
        tipos_map = {'I': 'Ingreso', 'E': 'Egreso', 'T': 'Traslado', 'N': 'Nómina', 'P': 'Pago'}
        for t in tipos:
            tipo_nombre = tipos_map.get(t.tipo_comprobante, t.tipo_comprobante)
            contexto += f"- {tipo_nombre}: {t.cantidad} facturas por ${float(t.total):,.2f}\n"

        return contexto
    except Exception as e:
        logger.error(f"Error obteniendo contexto de CFDIs: {e}")
        return "No hay datos de CFDIs disponibles."


def procesar_consulta_natural(mensaje: str, db: Session, client_id: str = "COLIMAN001") -> dict:
    """Procesa consultas en lenguaje natural y devuelve datos relevantes"""
    mensaje_lower = mensaje.lower()

    try:
        # Consulta de totales
        if any(word in mensaje_lower for word in ['total', 'suma', 'monto', 'facturado', 'cuanto']):
            query = text("""
                SELECT
                    COUNT(*) as total_cfdis,
                    COALESCE(SUM(total), 0) as monto_total,
                    COALESCE(SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END), 0) as ingresos,
                    COALESCE(SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END), 0) as egresos
                FROM cfdi
                WHERE client_id = :client_id
            """)
            result = db.execute(query, {"client_id": client_id}).fetchone()

            return {
                "tipo": "totales",
                "datos": {
                    "total_cfdis": result.total_cfdis,
                    "monto_total": float(result.monto_total),
                    "ingresos": float(result.ingresos),
                    "egresos": float(result.egresos),
                    "utilidad": float(result.ingresos) - float(result.egresos)
                },
                "respuesta": f"""📊 **Resumen de Facturación**

**Total de CFDIs:** {result.total_cfdis}
**Monto Total:** ${float(result.monto_total):,.2f} MXN

📈 **Ingresos:** ${float(result.ingresos):,.2f}
📉 **Egresos:** ${float(result.egresos):,.2f}
💰 **Utilidad Bruta:** ${float(result.ingresos) - float(result.egresos):,.2f}"""
            }

        # Consulta de clientes/receptores
        if any(word in mensaje_lower for word in ['cliente', 'receptor', 'top cliente', 'mejores cliente']):
            query = text("""
                SELECT receptor_nombre, receptor_rfc, COUNT(*) as num_facturas, SUM(total) as total
                FROM cfdi
                WHERE client_id = :client_id AND tipo_comprobante = 'I'
                GROUP BY receptor_nombre, receptor_rfc
                ORDER BY total DESC
                LIMIT 10
            """)
            results = db.execute(query, {"client_id": client_id}).fetchall()

            respuesta = "🏆 **Top 10 Clientes por Facturación**\n\n"
            datos = []
            for i, r in enumerate(results, 1):
                respuesta += f"{i}. **{r.receptor_nombre}**\n   RFC: {r.receptor_rfc} | {r.num_facturas} facturas | ${float(r.total):,.2f}\n\n"
                datos.append({
                    "nombre": r.receptor_nombre,
                    "rfc": r.receptor_rfc,
                    "facturas": r.num_facturas,
                    "total": float(r.total)
                })

            return {"tipo": "clientes", "datos": datos, "respuesta": respuesta}

        # Consulta de proveedores/emisores
        if any(word in mensaje_lower for word in ['proveedor', 'emisor', 'top proveedor', 'quién factura']):
            query = text("""
                SELECT emisor_nombre, emisor_rfc, COUNT(*) as num_facturas, SUM(total) as total
                FROM cfdi
                WHERE client_id = :client_id
                GROUP BY emisor_nombre, emisor_rfc
                ORDER BY total DESC
                LIMIT 10
            """)
            results = db.execute(query, {"client_id": client_id}).fetchall()

            respuesta = "📦 **Top 10 Proveedores por Facturación**\n\n"
            datos = []
            for i, r in enumerate(results, 1):
                respuesta += f"{i}. **{r.emisor_nombre}**\n   RFC: {r.emisor_rfc} | {r.num_facturas} facturas | ${float(r.total):,.2f}\n\n"
                datos.append({
                    "nombre": r.emisor_nombre,
                    "rfc": r.emisor_rfc,
                    "facturas": r.num_facturas,
                    "total": float(r.total)
                })

            return {"tipo": "proveedores", "datos": datos, "respuesta": respuesta}

        # Consulta de tendencias
        if any(word in mensaje_lower for word in ['tendencia', 'mes', 'mensual', 'historia', 'histórico']):
            query = text("""
                SELECT
                    DATE_FORMAT(fecha, '%Y-%m') as mes,
                    COUNT(*) as cantidad,
                    SUM(total) as total
                FROM cfdi
                WHERE client_id = :client_id
                GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                ORDER BY mes DESC
                LIMIT 12
            """)
            results = db.execute(query, {"client_id": client_id}).fetchall()

            respuesta = "📅 **Tendencia Mensual de Facturación**\n\n"
            datos = []
            for r in results:
                respuesta += f"📌 **{r.mes}:** {r.cantidad} CFDIs | ${float(r.total):,.2f}\n"
                datos.append({
                    "mes": r.mes,
                    "cantidad": r.cantidad,
                    "total": float(r.total)
                })

            return {"tipo": "tendencia", "datos": datos, "respuesta": respuesta}

        # Consulta de pendientes
        if any(word in mensaje_lower for word in ['pendiente', 'validar', 'sin validar', 'revisar']):
            query = text("""
                SELECT uuid, emisor_nombre, total, fecha, estatus_validacion
                FROM cfdi
                WHERE client_id = :client_id AND estatus_validacion = 'pendiente'
                ORDER BY total DESC
                LIMIT 10
            """)
            results = db.execute(query, {"client_id": client_id}).fetchall()

            count_query = text("""
                SELECT COUNT(*) as total, SUM(total) as monto
                FROM cfdi
                WHERE client_id = :client_id AND estatus_validacion = 'pendiente'
            """)
            count = db.execute(count_query, {"client_id": client_id}).fetchone()

            respuesta = f"⏳ **CFDIs Pendientes de Validación**\n\n"
            respuesta += f"**Total pendientes:** {count.total} facturas por ${float(count.monto or 0):,.2f}\n\n"
            respuesta += "**Top 10 por monto:**\n"

            datos = []
            for r in results:
                fecha_str = r.fecha.strftime('%Y-%m-%d') if r.fecha else 'N/A'
                respuesta += f"• {r.emisor_nombre}: ${float(r.total):,.2f} ({fecha_str})\n"
                datos.append({
                    "uuid": r.uuid,
                    "emisor": r.emisor_nombre,
                    "total": float(r.total),
                    "fecha": fecha_str
                })

            return {"tipo": "pendientes", "datos": datos, "respuesta": respuesta}

        # Resumen general
        return None

    except Exception as e:
        logger.error(f"Error procesando consulta: {e}")
        return None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint de chat con el agente MCP
    Procesa el mensaje y devuelve una respuesta inteligente
    """
    try:
        mensaje = request.mensaje.strip()
        client_id = current_user.client_id or "COLIMAN001"

        # Intentar procesar como consulta de datos
        resultado = procesar_consulta_natural(mensaje, db, client_id)

        if resultado:
            return ChatResponse(
                respuesta=resultado["respuesta"],
                datos=resultado.get("datos"),
                tipo=resultado["tipo"]
            )

        # Si no es una consulta de datos específica, obtener contexto y generar respuesta
        contexto = get_cfdi_context(db, client_id)

        # Buscar configuración de AI
        query_ai = text("""
            SELECT provider, api_key, model, system_prompt
            FROM ai_configs
            WHERE is_active = 1
            LIMIT 1
        """)
        ai_config = db.execute(query_ai).fetchone()

        if ai_config and ai_config.api_key:
            # Usar la API de AI configurada
            try:
                respuesta = await call_ai_api(
                    mensaje=mensaje,
                    contexto=contexto,
                    provider=ai_config.provider,
                    api_key=ai_config.api_key,
                    model=ai_config.model,
                    system_prompt=ai_config.system_prompt
                )
                return ChatResponse(respuesta=respuesta, tipo="ai")
            except Exception as e:
                logger.error(f"Error llamando API de AI: {e}")

        # Respuesta por defecto si no hay AI configurada
        respuesta_default = generar_respuesta_default(mensaje, contexto)
        return ChatResponse(respuesta=respuesta_default, tipo="default")

    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error procesando mensaje: {str(e)}")


async def call_ai_api(mensaje: str, contexto: str, provider: str, api_key: str, model: str, system_prompt: str = None) -> str:
    """Llama a la API de AI configurada"""

    default_system = """Eres Cool Iman, un asistente inteligente para gestión de facturas electrónicas (CFDIs) en México.
Ayudas a los usuarios a entender sus datos de facturación, generar análisis y responder consultas.
Responde de forma clara, profesional y amigable. Usa emojis ocasionalmente para hacer la conversación más agradable.
Si no tienes datos específicos, sugiere al usuario qué puede consultar."""

    system_message = system_prompt or default_system

    if provider.lower() == "openai":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model or "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": f"{system_message}\n\nCONTEXTO DE DATOS:\n{contexto}"},
                        {"role": "user", "content": mensaje}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    elif provider.lower() == "anthropic":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model or "claude-3-haiku-20240307",
                    "max_tokens": 1000,
                    "system": f"{system_message}\n\nCONTEXTO DE DATOS:\n{contexto}",
                    "messages": [
                        {"role": "user", "content": mensaje}
                    ]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]

    elif provider.lower() == "gemini":
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model or 'gemini-pro'}:generateContent",
                headers={"Content-Type": "application/json"},
                params={"key": api_key},
                json={
                    "contents": [{
                        "parts": [{
                            "text": f"{system_message}\n\nCONTEXTO:\n{contexto}\n\nUSUARIO: {mensaje}"
                        }]
                    }]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    else:
        raise ValueError(f"Proveedor de AI no soportado: {provider}")


def generar_respuesta_default(mensaje: str, contexto: str) -> str:
    """Genera una respuesta por defecto cuando no hay AI configurada"""
    mensaje_lower = mensaje.lower()

    if any(word in mensaje_lower for word in ['hola', 'hello', 'buenos', 'buenas']):
        return "¡Hola! 👋 Soy Cool Iman, tu asistente de facturación. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus CFDIs, totales facturados, clientes, proveedores o tendencias."

    if any(word in mensaje_lower for word in ['gracias', 'thank']):
        return "¡De nada! 😊 Estoy aquí para ayudarte. ¿Hay algo más que necesites?"

    if any(word in mensaje_lower for word in ['ayuda', 'help', 'puedo', 'opciones']):
        return """🤖 **Soy Cool Iman y puedo ayudarte con:**

📊 **Consultas de datos:**
• "¿Cuál es el total facturado?" - Ver resumen de facturación
• "Muéstrame los top clientes" - Ver mejores clientes
• "¿Quiénes son mis proveedores?" - Ver proveedores principales
• "Tendencia mensual" - Ver histórico de facturación
• "Facturas pendientes" - Ver CFDIs por validar

💡 Solo escribe tu pregunta y te ayudaré con la información que necesites."""

    return f"""Entiendo tu consulta sobre: "{mensaje}"

Actualmente puedo ayudarte con información de tus CFDIs. Prueba preguntando:
• "¿Cuál es el total facturado?"
• "Muéstrame mis top clientes"
• "¿Cuántas facturas tengo pendientes?"

{contexto[:500]}..."""
