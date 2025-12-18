from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

# Schema base
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.CONSULTA
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None

# Schema para crear usuario
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        """Validar que la contraseña sea fuerte"""
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isupper() for char in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(char.islower() for char in v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        return v

# Schema para actualizar usuario
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None

# Schema de respuesta
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema para login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema para token
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Schema para cambio de contraseña
class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @validator('new_password')
    def validate_password(cls, v):
        """Validar que la contraseña sea fuerte"""
        if not any(char.isdigit() for char in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(char.isupper() for char in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(char.islower() for char in v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        return v
