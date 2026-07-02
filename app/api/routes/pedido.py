from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random, string
from app.api.deps import get_db, get_current_user
from app.models.pedido import Direccion, TrackingPedido, TrackingEvento
from app.models.usuario import Usuario
from app.models.contenedor import SolicitudCotizacion, Ruta
from app.models.viaje import Viaje, UbicacionGps
from app.schemas.pedido import DireccionCreate, DireccionResponse, TrackingResponse, CODIGOS_POSTALES
from app.estructuras import Pila
from app.data.bolivia_grafo import ruta_waypoints

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

def generar_numero_rastreo(departamento: str, usuario_id: int) -> str:
    prefijo = CODIGOS_POSTALES.get(departamento, 'BO')
    aleatorio = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"BT-{prefijo}-{aleatorio}"

def generar_codigo_postal(departamento: str, ciudad: str, usuario_id: int) -> str:
    prefijo = CODIGOS_POSTALES.get(departamento, 'BO')
    numero = str(usuario_id).zfill(5)
    return f"{prefijo}-{numero}"

@router.post("/direccion")
def guardar_direccion(
    data: DireccionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    existente = db.query(Direccion).filter(Direccion.usuario_id == current_user.id).first()
    codigo_postal = generar_codigo_postal(data.departamento, data.ciudad, current_user.id)

    if existente:
        for k, v in data.dict().items():
            setattr(existente, k, v)
        existente.codigo_postal = codigo_postal
        db.commit()
        db.refresh(existente)
        return {"message": "Direccion actualizada", "codigo_postal": codigo_postal, "direccion": existente}

    direccion = Direccion(
        usuario_id    = current_user.id,
        departamento  = data.departamento,
        ciudad        = data.ciudad,
        zona          = data.zona,
        calle         = data.calle,
        numero        = data.numero,
        referencia    = data.referencia,
        codigo_postal = codigo_postal,
    )
    db.add(direccion)
    db.commit()
    db.refresh(direccion)

    # Generar tracking para solicitudes pendientes sin tracking
    solicitudes = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.usuario_id == current_user.id
    ).all()
    for s in solicitudes:
        tracking_existente = db.query(TrackingPedido).filter(
            TrackingPedido.solicitud_id == s.id
        ).first()
        if not tracking_existente:
            tracking = TrackingPedido(
                solicitud_id   = s.id,
                numero_rastreo = generar_numero_rastreo(data.departamento, current_user.id),
                estado         = s.estado,
            )
            db.add(tracking)
    db.commit()

    return {"message": "Direccion guardada", "codigo_postal": codigo_postal, "direccion": direccion}

@router.get("/direccion", response_model=DireccionResponse)
def get_direccion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    direccion = db.query(Direccion).filter(Direccion.usuario_id == current_user.id).first()
    if not direccion:
        raise HTTPException(status_code=404, detail="Sin direccion registrada")
    return direccion

@router.get("/mis-pedidos")
def mis_pedidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    solicitudes = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.usuario_id == current_user.id
    ).all()

    resultado = []
    for s in solicitudes:
        tracking = db.query(TrackingPedido).filter(
            TrackingPedido.solicitud_id == s.id
        ).first()
        resultado.append({
            "solicitud_id":    s.id,
            "descripcion":     s.descripcion_carga or "Sin descripcion",
            "estado":          s.estado,
            "numero_rastreo":  tracking.numero_rastreo if tracking else None,
            "ubicacion":       tracking.ubicacion_actual if tracking else None,
            "creado_en":       str(s.creado_en),
        })
    return resultado


@router.get("/internacionales")
def pedidos_internacionales(db: Session = Depends(get_db),
                            current_user: Usuario = Depends(get_current_user)):
    """Pedidos de ambito internacional (visibles para cualquier cliente)."""
    solicitudes = (db.query(SolicitudCotizacion)
                   .filter(SolicitudCotizacion.ambito == "internacional")
                   .order_by(SolicitudCotizacion.creado_en.desc())
                   .all())
    salida = []
    for s in solicitudes:
        tracking = db.query(TrackingPedido).filter(
            TrackingPedido.solicitud_id == s.id).first()
        salida.append({
            "solicitud_id": s.id,
            "descripcion": s.descripcion_carga or "Sin descripcion",
            "estado": s.estado,
            "destino": s.destino_personalizado,
            "numero_rastreo": tracking.numero_rastreo if tracking else None,
            "creado_en": str(s.creado_en),
        })
    return salida


def _tracking_por_numero(numero: str, db: Session) -> TrackingPedido:
    tracking = db.query(TrackingPedido).filter(
        TrackingPedido.numero_rastreo == numero).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Numero de rastreo no encontrado")
    return tracking


@router.get("/{numero_rastreo}/recorrido")
def recorrido_pedido(numero_rastreo: str, db: Session = Depends(get_db),
                     current_user: Usuario = Depends(get_current_user)):
    """Lista enlazada del recorrido del paquete (eventos en orden de avance)."""
    tracking = _tracking_por_numero(numero_rastreo, db)
    eventos = (db.query(TrackingEvento)
               .filter(TrackingEvento.tracking_id == tracking.id)
               .order_by(TrackingEvento.orden.asc())
               .all())
    return {
        "numero_rastreo": tracking.numero_rastreo,
        "estado": tracking.estado,
        "recorrido": [{"orden": e.orden, "descripcion": e.descripcion,
                       "creado_en": str(e.creado_en)} for e in eventos],
    }


@router.get("/rastrear/{numero_rastreo}")
def rastrear_pedido(numero_rastreo: str, db: Session = Depends(get_db),
                    current_user: Usuario = Depends(get_current_user)):
    """Estado en vivo del pedido para el cliente (polling).

    Une tracking -> pedido -> viaje (BOLTRAIN DRIVE) -> GPS. Devuelve el estado
    actual (tope de la Pila), el historial apilado (LIFO), la ruta A* y la
    ultima posicion del transportista."""
    tracking = _tracking_por_numero(numero_rastreo, db)
    solicitud = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.id == tracking.solicitud_id).first()

    # Pila del historial de estados (LIFO): el tope es el estado actual.
    pila = Pila()
    eventos = (db.query(TrackingEvento)
               .filter(TrackingEvento.tracking_id == tracking.id)
               .order_by(TrackingEvento.orden.asc())
               .all())
    for e in eventos:
        pila.apilar({"orden": e.orden, "descripcion": e.descripcion,
                     "creado_en": str(e.creado_en)})

    # Viaje asociado al pedido (si el admin ya lo asigno a un chofer).
    viaje = db.query(Viaje).filter(Viaje.solicitud_id == tracking.solicitud_id).first()

    en_movimiento = False
    ultima = None
    astar = {"waypoints": [], "resuelto": False, "distancia_km": 0.0}
    ruta = None
    if viaje:
        ruta = db.query(Ruta).filter(Ruta.id == viaje.ruta_id).first()
        en_movimiento = (viaje.estado == "en_curso" and viaje.ultima_lat is not None)
        if viaje.ultima_lat is not None:
            ultima = {"lat": float(viaje.ultima_lat), "lng": float(viaje.ultima_lng),
                      "en": str(viaje.ultima_pos_en)}
    elif solicitud and solicitud.ruta_id:
        ruta = db.query(Ruta).filter(Ruta.id == solicitud.ruta_id).first()

    if ruta:
        astar = ruta_waypoints(ruta.origen_ciudad, ruta.origen_pais,
                               ruta.destino_ciudad, ruta.destino_pais)

    return {
        "numero_rastreo": tracking.numero_rastreo,
        "estado_tracking": tracking.estado,
        "estado_actual": pila.tope(),           # tope de la pila
        "historial": pila.a_lista(),            # LIFO: mas reciente primero
        "ambito": solicitud.ambito if solicitud else None,
        "destino": solicitud.destino_personalizado if solicitud else None,
        "en_movimiento": en_movimiento,
        "estado_viaje": viaje.estado if viaje else None,
        "astar": astar,
        "ultima_posicion": ultima,
    }