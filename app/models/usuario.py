from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.db.base import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    tipo_usuario   = Column(Enum('importador','exportador','inversor','tecnico'), nullable=False)
    nombre         = Column(String(100), nullable=False)
    apellido       = Column(String(100), nullable=False)
    email          = Column(String(150), nullable=False, unique=True)
    telefono       = Column(String(20))
    pais           = Column(String(80), default='Bolivia')
    empresa        = Column(String(150))
    password_hash  = Column(String(255), nullable=False)
    activo         = Column(Boolean, default=True)
    creado_en      = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())