"""Gestor en memoria de las colas de pedidos (singletons de la app).

Modelo de dos colas EXCLUSIVAS y ambas FIFO:
  - COLA_PEDIDOS  (Cola)         -> pedidos normales, en orden de llegada.
  - COLA_PRIORIDAD (ColaPrioridad) -> pedidos marcados como prioritarios; se
    encolan todos con la misma prioridad, de modo que salen tambien en FIFO.
Un pedido esta en UNA sola cola. El cliente decide la prioridad al crear el
pedido; el admin tambien puede mover uno de la cola normal a la de prioridad.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.estructuras.cola import Cola
from app.estructuras.cola_prioridad import ColaPrioridad
from app.models.contenedor import SolicitudCotizacion

# Prioridad unica para que la cola de prioridad se comporte FIFO entre iguales.
_PRIO = 1

COLA_PEDIDOS = Cola()
COLA_PRIORIDAD = ColaPrioridad()


def es_prioritario(sol: SolicitudCotizacion) -> bool:
    return bool(sol.prioridad and sol.prioridad > 0)


def _item(sol: SolicitudCotizacion) -> dict:
    return {
        "solicitud_id": sol.id,
        "ambito": sol.ambito,
        "prioridad": sol.prioridad or 0,
        "descripcion": sol.descripcion_carga,
        "usuario_id": sol.usuario_id,
    }


def encolar_pedido(sol: SolicitudCotizacion) -> None:
    """Encola el pedido en la cola que corresponde segun su prioridad."""
    item = _item(sol)
    if es_prioritario(sol):
        COLA_PRIORIDAD.encolar(item, _PRIO)   # FIFO entre prioritarios
    else:
        COLA_PEDIDOS.encolar(item)            # FIFO normal


def priorizar(solicitud_id: int) -> bool:
    """Mueve un pedido de la cola normal a la de prioridad (al final, FIFO)."""
    global COLA_PEDIDOS
    restantes = []
    encontrado = None
    for it in COLA_PEDIDOS.a_lista():
        if it["solicitud_id"] == solicitud_id and encontrado is None:
            encontrado = it
        else:
            restantes.append(it)
    if encontrado is None:
        return False
    COLA_PEDIDOS = Cola()
    for it in restantes:
        COLA_PEDIDOS.encolar(it)
    encontrado["prioridad"] = _PRIO
    COLA_PRIORIDAD.encolar(encontrado, _PRIO)
    return True


def remover(solicitud_id: int) -> None:
    """Saca un pedido de ambas colas (p.ej. al despacharlo)."""
    global COLA_PEDIDOS, COLA_PRIORIDAD
    fifo = [it for it in COLA_PEDIDOS.a_lista() if it["solicitud_id"] != solicitud_id]
    COLA_PEDIDOS = Cola()
    for it in fifo:
        COLA_PEDIDOS.encolar(it)

    prio = [(it, p) for it, p in COLA_PRIORIDAD.a_lista()
            if it["solicitud_id"] != solicitud_id]
    COLA_PRIORIDAD = ColaPrioridad()
    for it, p in prio:
        COLA_PRIORIDAD.encolar(it, p)


def siguiente_a_despachar() -> Optional[dict]:
    """Frente de la cola de prioridad (FIFO); si no hay, frente de la normal."""
    if not COLA_PRIORIDAD.esta_vacia():
        return COLA_PRIORIDAD.frente()
    return COLA_PEDIDOS.frente()


def reconstruir(db: Session) -> None:
    """Rellena las colas desde los pedidos pendientes de la BD (al iniciar)."""
    global COLA_PEDIDOS, COLA_PRIORIDAD
    COLA_PEDIDOS = Cola()
    COLA_PRIORIDAD = ColaPrioridad()
    pendientes = (db.query(SolicitudCotizacion)
                  .filter(SolicitudCotizacion.estado == "pendiente")
                  .order_by(SolicitudCotizacion.creado_en.asc())
                  .all())
    for sol in pendientes:
        encolar_pedido(sol)
