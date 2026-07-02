# Importa los modelos para registrar el mapeo de SQLAlchemy.
from app.models.usuario import Usuario  # noqa: F401
from app.models.empresa import Empresa  # noqa: F401
from app.models.contenedor import (  # noqa: F401
    CategoriaCarga, Ruta, SolicitudCotizacion,
)
from app.models.pedido import Direccion, TrackingPedido, TrackingEvento  # noqa: F401
from app.models.viaje import Viaje, UbicacionGps  # noqa: F401
