from sqlalchemy import (Column, Integer, BigInteger, String, Date, DateTime,
                        Enum, DECIMAL, ForeignKey)
from sqlalchemy.sql import func
from app.db.base import Base


class Viaje(Base):
    """Asignacion diaria de un chofer a una ruta (creada por el admin)."""
    __tablename__ = "viajes"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    chofer_id     = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    ruta_id       = Column(Integer, ForeignKey("rutas.id"), nullable=False)
    solicitud_id  = Column(Integer, ForeignKey("solicitudes_cotizacion.id"))  # pedido
    empresa       = Column(String(150))
    fecha         = Column(Date, nullable=False)
    salida_programada = Column(DateTime)  # #3 momento exacto de salida (fija el admin)
    estado        = Column(Enum('programado', 'en_curso', 'finalizado'),
                           default='programado')
    iniciado_en   = Column(DateTime)
    finalizado_en = Column(DateTime)
    ultima_lat    = Column(DECIMAL(10, 7))
    ultima_lng    = Column(DECIMAL(10, 7))
    ultima_pos_en = Column(DateTime)
    creado_en     = Column(DateTime, server_default=func.now())


class UbicacionGps(Base):
    """Cada punto GPS que envia la app del chofer (trayectoria del viaje)."""
    __tablename__ = "ubicaciones_gps"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    viaje_id     = Column(Integer, ForeignKey("viajes.id"), nullable=False)
    lat          = Column(DECIMAL(10, 7), nullable=False)
    lng          = Column(DECIMAL(10, 7), nullable=False)
    velocidad    = Column(DECIMAL(6, 2))
    capturado_en = Column(DateTime, nullable=False)
    recibido_en  = Column(DateTime, server_default=func.now())
