from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class TipoUsuario(str, Enum):
    cliente       = "cliente"        # usa la web: crea y rastrea pedidos
    transportista = "transportista"  # chofer de BOLTRAIN DRIVE

class UsuarioRegistro(BaseModel):
    tipo_usuario: TipoUsuario
    nombre:       str
    apellido:     str
    email:        EmailStr
    telefono:       Optional[str] = None
    pais:           Optional[str] = "Bolivia"
    empresa:        Optional[str] = None
    codigo_empresa: Optional[str] = None  # #7: unirse a una empresa; None/"" = libre
    password:       str

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
    empresa_id:   Optional[int] = None
    es_admin:     bool = False

    class Config:
        from_attributes = True