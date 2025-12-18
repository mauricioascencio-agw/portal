from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class UserRole(str, enum.Enum):
    """Roles de usuario"""
    SUPERADMIN = "superadmin"  # Administrador del sistema
    ADMIN = "admin"            # Administrador de cliente
    CONTADOR = "contador"      # Contador
    ANALISTA = "analista"      # Analista fiscal
    CONSULTA = "consulta"      # Solo consulta

class User(Base):
    """Modelo de Usuario"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CONSULTA, nullable=False)

    # Identificación del cliente (para multi-tenancy)
    client_id = Column(String(50), index=True, nullable=True)
    client_name = Column(String(255), nullable=True)

    # Estados
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Información adicional
    phone = Column(String(20), nullable=True)
    company = Column(String(255), nullable=True)
    position = Column(String(100), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
