from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class Direccion(Base):
    __tablename__ = "direcciones"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id    = Column(Integer, ForeignKey("usuarios.id"), nullable=False, unique=True)
    departamento  = Column(String(100), nullable=False)
    ciudad        = Column(String(100), nullable=False)
    zona          = Column(String(100))
    calle         = Column(String(200))
    numero        = Column(String(20))
    referencia    = Column(Text)
    codigo_postal = Column(String(20))
    creado_en     = Column(DateTime, server_default=func.now())

class TrackingPedido(Base):
    __tablename__ = "tracking_pedidos"
    id               = Column(Integer, primary_key=True, autoincrement=True)
    solicitud_id     = Column(Integer, ForeignKey("solicitudes_cotizacion.id"), nullable=False)
    numero_rastreo   = Column(String(50), nullable=False, unique=True)
    estado           = Column(Enum('pendiente','en_revision','cotizado','confirmado','en_almacen','despachado','en_transito','en_aduana','en_destino','entregado'), default='pendiente')
    ubicacion_actual = Column(String(200))
    notas            = Column(Text)
    actualizado_en   = Column(DateTime, server_default=func.now(), onupdate=func.now())
    creado_en        = Column(DateTime, server_default=func.now())


class TrackingEvento(Base):
    """Cada nodo del recorrido del paquete (lista enlazada persistida).

    En orden ascendente por `orden` forman la trayectoria del envio; se usan
    tambien como pila (LIFO) para el historial de estados de la mercancia."""
    __tablename__ = "tracking_eventos"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    tracking_id = Column(Integer, ForeignKey("tracking_pedidos.id"), nullable=False)
    descripcion = Column(String(200), nullable=False)
    orden       = Column(Integer, nullable=False)
    creado_en   = Column(DateTime, server_default=func.now())