from pydantic import BaseModel
from typing import Optional
from enum import Enum

class TipoRuta(str, Enum):
    predeterminada = "predeterminada"
    personalizada  = "personalizada"

class CategoriaResponse(BaseModel):
    id:          int
    nombre:      str
    descripcion: Optional[str]
    icono:       Optional[str]
    class Config:
        from_attributes = True

class RutaResponse(BaseModel):
    id:               int
    origen_pais:      str
    origen_ciudad:    Optional[str]
    destino_pais:     str
    destino_ciudad:   Optional[str]
    tiempo_estimado:  Optional[str]
    es_predeterminada: bool
    class Config:
        from_attributes = True

class SolicitudCreate(BaseModel):
    categoria_id:           int
    ruta_id:                Optional[int]
    origen_personalizado:   Optional[str]
    destino_personalizado:  Optional[str]
    tipo_ruta:              TipoRuta
    peso_kg:                Optional[float]
    volumen_m3:             Optional[float]
    cantidad_unidades:      Optional[int]
    descripcion_carga:      Optional[str]
    requiere_refrigeracion: Optional[bool] = False
    carga_fragil:           Optional[bool] = False
    carga_peligrosa:        Optional[bool] = False

class SolicitudResponse(BaseModel):
    id:              int
    categoria_id:    int
    tipo_ruta:       str
    estado:          str
    peso_kg:         Optional[float]
    volumen_m3:      Optional[float]
    descripcion_carga: Optional[str]
    precio_estimado: Optional[float]
    creado_en:       str
    class Config:
        from_attributes = True