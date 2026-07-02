"""Rutas para visualizar/operar las estructuras de datos (solo admin).

Muestran la Cola FIFO (llegada) y la Cola de prioridad (orden de salida) de los
pedidos, y permiten:
  - priorizar: el admin elige un pedido de la cola normal -> sube a prioridad y
    entra a ALMACEN (se empaca primero).
  - despachar: el admin lo saca del almacen -> DESPACHADO (sale hacia el cliente).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin
from app.models.usuario import Usuario
from app.models.contenedor import SolicitudCotizacion
from app.models.pedido import TrackingPedido, TrackingEvento
from app.estructuras import gestor

router = APIRouter(prefix="/ds", tags=["estructuras"])


def _tracking(solicitud_id: int, db: Session) -> TrackingPedido:
    tracking = db.query(TrackingPedido).filter(
        TrackingPedido.solicitud_id == solicitud_id).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Pedido sin tracking")
    return tracking


def _agregar_evento(tracking: TrackingPedido, descripcion: str, db: Session) -> None:
    n = (db.query(TrackingEvento)
         .filter(TrackingEvento.tracking_id == tracking.id).count())
    db.add(TrackingEvento(tracking_id=tracking.id, descripcion=descripcion, orden=n + 1))


@router.get("/cola")
def ver_cola(admin: Usuario = Depends(get_current_admin)):
    """Pedidos en la Cola FIFO (orden de llegada, frente -> final)."""
    return {"tamano": len(gestor.COLA_PEDIDOS), "items": gestor.COLA_PEDIDOS.a_lista()}


@router.get("/cola-prioridad")
def ver_cola_prioridad(admin: Usuario = Depends(get_current_admin)):
    """Pedidos ordenados por prioridad (lo que sale primero)."""
    return {
        "tamano": len(gestor.COLA_PRIORIDAD),
        "items": [{"pedido": v, "prioridad": p}
                  for v, p in gestor.COLA_PRIORIDAD.a_lista()],
    }


@router.post("/priorizar/{solicitud_id}")
def priorizar(solicitud_id: int, db: Session = Depends(get_db),
              admin: Usuario = Depends(get_current_admin)):
    """El admin elige un pedido de la cola normal: sube a prioridad y entra a almacen."""
    if not gestor.priorizar(solicitud_id):
        raise HTTPException(status_code=404, detail="El pedido no esta en la cola")
    sol = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.id == solicitud_id).first()
    if sol:
        sol.estado = "en_revision"
    tracking = _tracking(solicitud_id, db)
    tracking.estado = "en_almacen"
    _agregar_evento(tracking, "En almacen — empacando tu pedido", db)
    db.commit()
    return {"message": "Pedido priorizado y enviado a almacen",
            "solicitud_id": solicitud_id}


@router.post("/despachar/{solicitud_id}")
def despachar(solicitud_id: int, db: Session = Depends(get_db),
              admin: Usuario = Depends(get_current_admin)):
    """El admin despacha el pedido desde el almacen (sale hacia el cliente)."""
    tracking = _tracking(solicitud_id, db)
    tracking.estado = "despachado"
    _agregar_evento(tracking, "Despachado — tu pedido salio del almacen", db)
    sol = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.id == solicitud_id).first()
    if sol:
        sol.estado = "aceptado"
    db.commit()
    gestor.remover(solicitud_id)
    return {"message": "Pedido despachado", "solicitud_id": solicitud_id,
            "quedan_en_cola": len(gestor.COLA_PRIORIDAD)}


# Estados que se consideran "en proceso" (ya salieron de la cola de espera).
_EN_PROCESO = ("en_almacen", "despachado", "en_transito", "en_aduana", "en_destino")


@router.get("/en-proceso")
def en_proceso(db: Session = Depends(get_db),
               admin: Usuario = Depends(get_current_admin)):
    """Pedidos en almacen / camino (no entregados). Desde aqui se marcan entregados."""
    salida = []
    q = (db.query(SolicitudCotizacion, TrackingPedido)
         .join(TrackingPedido, TrackingPedido.solicitud_id == SolicitudCotizacion.id)
         .filter(TrackingPedido.estado.in_(_EN_PROCESO)))
    for sol, tracking in q.all():
        salida.append({
            "id": sol.id,
            "numero_rastreo": tracking.numero_rastreo,
            "estado": tracking.estado,
            "ambito": sol.ambito,
            "destino": sol.destino_personalizado or "-",
            "descripcion": sol.descripcion_carga,
        })
    return salida


@router.post("/entregar/{solicitud_id}")
def entregar(solicitud_id: int, db: Session = Depends(get_db),
             admin: Usuario = Depends(get_current_admin)):
    """Marca el pedido como ENTREGADO (fin del ciclo) y lo saca de toda cola."""
    tracking = _tracking(solicitud_id, db)
    tracking.estado = "entregado"
    _agregar_evento(tracking, "Entregado — pedido entregado al cliente", db)
    sol = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.id == solicitud_id).first()
    if sol:
        sol.estado = "aceptado"
    db.commit()
    gestor.remover(solicitud_id)
    return {"message": "Pedido entregado", "solicitud_id": solicitud_id}
