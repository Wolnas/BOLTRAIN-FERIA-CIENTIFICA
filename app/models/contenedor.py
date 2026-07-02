from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class CategoriaCarga(Base):
    __tablename__ = "categorias_carga"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    nombre      = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    icono       = Column(String(50))

class Ruta(Base):
    __tablename__ = "rutas"
    id                = Column(Integer, primary_key=True, autoincrement=True)
    origen_pais       = Column(String(100), nullable=False)
    origen_ciudad     = Column(String(100))
    destino_pais      = Column(String(100), nullable=False)
    destino_ciudad    = Column(String(100))
    es_predeterminada = Column(Boolean, default=False)
    tiempo_estimado   = Column(String(50))
    activa            = Column(Boolean, default=True)

class SolicitudCotizacion(Base):
    __tablename__ = "solicitudes_cotizacion"
    id                      = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id              = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    categoria_id            = Column(Integer, ForeignKey("categorias_carga.id"), nullable=False)
    ruta_id                 = Column(Integer, ForeignKey("rutas.id"))
    origen_personalizado    = Column(String(200))
    destino_personalizado   = Column(String(200))
    tipo_ruta               = Column(Enum('predeterminada','personalizada'), default='predeterminada')
    peso_kg                 = Column(DECIMAL(10,2))
    volumen_m3              = Column(DECIMAL(10,2))
    cantidad_unidades       = Column(Integer)
    descripcion_carga       = Column(Text)
    requiere_refrigeracion  = Column(Boolean, default=False)
    carga_fragil            = Column(Boolean, default=False)
    carga_peligrosa         = Column(Boolean, default=False)
    estado                  = Column(Enum('pendiente','en_revision','cotizado','aceptado','rechazado'), default='pendiente')
    ambito                  = Column(Enum('nacional','internacional'), default='nacional')
    prioridad               = Column(Integer, default=0)  # para la cola de prioridad
    precio_estimado         = Column(DECIMAL(12,2))
    notas_tecnico           = Column(Text)
    creado_en               = Column(DateTime, server_default=func.now())
    actualizado_en          = Column(DateTime, server_default=func.now(), onupdate=func.now())