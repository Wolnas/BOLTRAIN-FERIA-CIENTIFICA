from pydantic import BaseModel
from typing import Optional

DEPARTAMENTOS = [
    'La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro',
    'Potosi', 'Chuquisaca', 'Tarija', 'Beni', 'Pando'
]

CODIGOS_POSTALES = {
    'La Paz': 'LP', 'Cochabamba': 'CB', 'Santa Cruz': 'SC',
    'Oruro': 'OR', 'Potosi': 'PT', 'Chuquisaca': 'CH',
    'Tarija': 'TJ', 'Beni': 'BE', 'Pando': 'PD'
}

class DireccionCreate(BaseModel):
    departamento: str
    ciudad:       str
    zona:         Optional[str] = None
    calle:        Optional[str] = None
    numero:       Optional[str] = None
    referencia:   Optional[str] = None

class DireccionResponse(BaseModel):
    id:            int
    departamento:  str
    ciudad:        str
    zona:          Optional[str]
    calle:         Optional[str]
    numero:        Optional[str]
    referencia:    Optional[str]
    codigo_postal: Optional[str]
    class Config:
        from_attributes = True

class TrackingResponse(BaseModel):
    id:               int
    solicitud_id:     int
    numero_rastreo:   str
    estado:           str
    ubicacion_actual: Optional[str]
    notas:            Optional[str]
    creado_en:        str
    class Config:
        from_attributes = True