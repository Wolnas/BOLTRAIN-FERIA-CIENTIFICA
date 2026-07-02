from pydantic import BaseModel


class EmpresaCreate(BaseModel):
    """Datos que envia el admin para crear su empresa."""
    nombre: str


class EmpresaResponse(BaseModel):
    id:     int
    nombre: str
    codigo: str

    class Config:
        from_attributes = True
