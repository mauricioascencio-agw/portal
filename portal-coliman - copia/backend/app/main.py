from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.database import engine, Base, get_db
from app.api import auth, cfdis, sat_descarga_masiva, config, kpis, users, constancia_fiscal, ai_config, reports, catalogs
from app.models import user, constancia_fiscal as constancia_model, ai_config as ai_model, app_config as app_config_model  # Importar modelos
from contextlib import asynccontextmanager
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear tablas
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Eventos de inicio y cierre de la aplicación"""
    logger.info("🚀 Iniciando aplicación...")
    logger.info("📊 Creando tablas en base de datos...")

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tablas creadas exitosamente")
    except Exception as e:
        logger.error(f"❌ Error al crear tablas: {e}")

    yield

    logger.info("👋 Cerrando aplicación...")

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cfdis.router)
app.include_router(sat_descarga_masiva.router)
app.include_router(config.router)
app.include_router(kpis.router)
app.include_router(constancia_fiscal.router)
app.include_router(ai_config.router)
app.include_router(reports.router)
app.include_router(catalogs.router)

# Ruta raíz
@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "online"
    }

# Health check
@app.get("/health")
async def health_check():
    """Verificar estado de la aplicación"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# Manejador de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones"""
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "message": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
