from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class TipoUsuario(str, Enum):
    importador = "importador"
    exportador = "exportador"
    inversor   = "inversor"
    tecnico    = "tecnico"

class UsuarioRegistro(BaseModel):
    tipo_usuario: TipoUsuario
    nombre:       str
    apellido:     str
    email:        EmailStr
    telefono:     Optional[str] = None
    pais:         Optional[str] = "Bolivia"
    empresa:      Optional[str] = None
    password:     str

class UsuarioLogin(BaseModel):
    email:    EmailStr
    password: str

class UsuarioResponse(BaseModel):
    id:           int
    tipo_usuario: str
    nombre:       str
    apellido:     str
    email:        str
    pais:         Optional[str]
    empresa:      Optional[str]

    class Config:
        from_attributes = True