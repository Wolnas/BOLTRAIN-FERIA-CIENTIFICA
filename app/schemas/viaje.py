from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ViajeCreate(BaseModel):
    """Datos que envia el admin para asignar un viaje a un chofer."""
    chofer_id:         int
    ruta_id:           int
    fecha:             date
    salida_programada: datetime              # #3 momento exacto de salida
    solicitud_id:      Optional[int] = None  # pedido (Envios Nacionales)
    empresa:           Optional[str] = None


class UbicacionCreate(BaseModel):
    """Punto GPS que envia la app del chofer durante un viaje."""
    lat:          float
    lng:          float
    capturado_en: datetime
    velocidad:    Optional[float] = None
