"""Rutas del CHOFER (transportista): ver sus viajes y enviar su ubicacion GPS.

Protegidas con get_current_user; cada chofer solo ve/opera SUS viajes.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.contenedor import Ruta
from app.models.pedido import TrackingPedido, TrackingEvento
from app.models.viaje import Viaje, UbicacionGps
from app.schemas.viaje import UbicacionCreate
from app.api.routes.pedido import generar_numero_rastreo
from app.data.bolivia_grafo import ruta_waypoints

router = APIRouter(prefix="/viajes", tags=["viajes"])


def _mi_viaje(viaje_id: int, db: Session, chofer: Usuario) -> Viaje:
    """Obtiene un viaje verificando que pertenezca al chofer autenticado."""
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if viaje.chofer_id != chofer.id:
        raise HTTPException(status_code=403, detail="Este viaje no es tuyo")
    return viaje


def _tracking_de(viaje: Viaje, db: Session) -> Optional[TrackingPedido]:
    """Tracking del pedido enlazado al viaje (si lo hay)."""
    if not viaje.solicitud_id:
        return None
    return (db.query(TrackingPedido)
            .filter(TrackingPedido.solicitud_id == viaje.solicitud_id)
            .first())


def _agregar_evento(tracking: TrackingPedido, descripcion: str, db: Session) -> None:
    """Agrega un nodo al recorrido del paquete (lista enlazada / pila)."""
    n = (db.query(TrackingEvento)
         .filter(TrackingEvento.tracking_id == tracking.id).count())
    db.add(TrackingEvento(tracking_id=tracking.id,
                          descripcion=descripcion, orden=n + 1))


def _puede_iniciar(viaje: Viaje) -> bool:
    """#4: solo se puede iniciar cuando llega la hora de salida programada."""
    if viaje.salida_programada is None:
        return True
    return datetime.now() >= viaje.salida_programada


@router.get("/mios")
def mis_viajes(db: Session = Depends(get_db),
               chofer: Usuario = Depends(get_current_user)):
    """Viajes del chofer que aun no estan finalizados (programados / en curso)."""
    viajes = (db.query(Viaje)
              .filter(Viaje.chofer_id == chofer.id,
                      Viaje.estado != "finalizado")
              .order_by(Viaje.fecha.desc(), Viaje.id.desc())
              .all())
    salida = []
    for v in viajes:
        ruta = db.query(Ruta).filter(Ruta.id == v.ruta_id).first()
        tracking = _tracking_de(v, db)
        salida.append({
            "id": v.id,
            "fecha": v.fecha,
            "salida_programada": v.salida_programada,
            "puede_iniciar": _puede_iniciar(v),
            "solicitud_id": v.solicitud_id,
            "numero_rastreo": tracking.numero_rastreo if tracking else None,
            "estado": v.estado,
            "empresa": v.empresa,
            "origen": (f"{ruta.origen_ciudad or ''} {ruta.origen_pais}".strip()
                       if ruta else "-"),
            "destino": (f"{ruta.destino_ciudad or ''} {ruta.destino_pais}".strip()
                        if ruta else "-"),
        })
    return salida


@router.post("/{viaje_id}/iniciar")
def iniciar_viaje(viaje_id: int, db: Session = Depends(get_db),
                  chofer: Usuario = Depends(get_current_user)):
    viaje = _mi_viaje(viaje_id, db, chofer)

    # #4: gate de horario (fuente de verdad en el servidor).
    if not _puede_iniciar(viaje):
        raise HTTPException(
            status_code=403,
            detail=f"Aun no es la hora de salida ({viaje.salida_programada}).")

    # #5: registrar salida.
    viaje.estado = "en_curso"
    viaje.iniciado_en = datetime.utcnow()

    # #6: generar / activar el tracking del pedido enlazado.
    numero_rastreo = None
    if viaje.solicitud_id:
        tracking = _tracking_de(viaje, db)
        ruta = db.query(Ruta).filter(Ruta.id == viaje.ruta_id).first()
        depto = (ruta.destino_ciudad if ruta else None) or ""
        if not tracking:
            tracking = TrackingPedido(
                solicitud_id=viaje.solicitud_id,
                numero_rastreo=generar_numero_rastreo(depto, chofer.id),
                estado="en_transito",
            )
            db.add(tracking)
            db.flush()
        else:
            tracking.estado = "en_transito"
        _agregar_evento(tracking, "Tu paquete ya esta en camino", db)
        db.commit()
        db.refresh(tracking)
        numero_rastreo = tracking.numero_rastreo
    else:
        db.commit()

    return {
        "message": "Viaje iniciado",
        "estado": viaje.estado,
        "solicitud_id": viaje.solicitud_id,
        "numero_rastreo": numero_rastreo,
    }


@router.post("/{viaje_id}/finalizar")
def finalizar_viaje(viaje_id: int, db: Session = Depends(get_db),
                    chofer: Usuario = Depends(get_current_user)):
    viaje = _mi_viaje(viaje_id, db, chofer)
    viaje.estado = "finalizado"
    viaje.finalizado_en = datetime.utcnow()
    tracking = _tracking_de(viaje, db)
    if tracking:
        tracking.estado = "en_destino"
        _agregar_evento(tracking, "En destino — el paquete llego a su destino", db)
    db.commit()
    return {"message": "Viaje finalizado", "estado": viaje.estado}


@router.get("/{viaje_id}/tracking")
def tracking_viaje(viaje_id: int, db: Session = Depends(get_db),
                   user: Usuario = Depends(get_current_user)):
    """#6: datos para el mapa: ID de tracking, ruta A* y puntos GPS.

    Accesible por el chofer dueno del viaje o por cualquier admin (dashboard)."""
    viaje = db.query(Viaje).filter(Viaje.id == viaje_id).first()
    if not viaje:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if viaje.chofer_id != user.id and not user.es_admin:
        raise HTTPException(status_code=403, detail="No autorizado")

    ruta = db.query(Ruta).filter(Ruta.id == viaje.ruta_id).first()
    astar = ruta_waypoints(
        ruta.origen_ciudad if ruta else None,
        ruta.origen_pais if ruta else None,
        ruta.destino_ciudad if ruta else None,
        ruta.destino_pais if ruta else None,
    ) if ruta else {"waypoints": [], "resuelto": False, "distancia_km": 0.0}

    puntos = (db.query(UbicacionGps)
              .filter(UbicacionGps.viaje_id == viaje.id)
              .order_by(UbicacionGps.capturado_en.asc())
              .all())
    gps = [{"lat": float(p.lat), "lng": float(p.lng),
            "capturado_en": p.capturado_en} for p in puntos]

    tracking = _tracking_de(viaje, db)
    return {
        "viaje_id": viaje.id,
        "estado": viaje.estado,
        "numero_rastreo": tracking.numero_rastreo if tracking else None,
        "astar": astar,
        "gps": gps,
        "ultima": ({"lat": float(viaje.ultima_lat), "lng": float(viaje.ultima_lng),
                    "en": viaje.ultima_pos_en}
                   if viaje.ultima_lat is not None else None),
    }


@router.post("/{viaje_id}/ubicacion")
def enviar_ubicacion(viaje_id: int, data: UbicacionCreate,
                     db: Session = Depends(get_db),
                     chofer: Usuario = Depends(get_current_user)):
    """Guarda un punto GPS y actualiza la ultima posicion del viaje."""
    viaje = _mi_viaje(viaje_id, db, chofer)

    punto = UbicacionGps(
        viaje_id=viaje.id,
        lat=data.lat,
        lng=data.lng,
        velocidad=data.velocidad,
        capturado_en=data.capturado_en,
    )
    db.add(punto)

    # Cache de la ultima posicion (para el mapa del dashboard).
    viaje.ultima_lat = data.lat
    viaje.ultima_lng = data.lng
    viaje.ultima_pos_en = data.capturado_en
    db.commit()
    return {"message": "Ubicacion recibida"}
