from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.contenedor import CategoriaCarga, Ruta, SolicitudCotizacion
from app.models.pedido import TrackingPedido, TrackingEvento
from app.schemas.contenedor import CategoriaResponse, RutaResponse, SolicitudCreate
from app.models.usuario import Usuario
from app.api.routes.pedido import generar_numero_rastreo
from app.estructuras import gestor

router = APIRouter(prefix="/contenedor", tags=["contenedor"])

@router.get("/categorias", response_model=List[CategoriaResponse])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaCarga).all()

@router.get("/rutas", response_model=List[RutaResponse])
def get_rutas(db: Session = Depends(get_db)):
    return db.query(Ruta).filter(Ruta.activa == True).all()  # noqa: E712

@router.post("/solicitud")
def crear_solicitud(
    data: SolicitudCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    ambito = data.ambito if data.ambito in ("nacional", "internacional") else "nacional"

    # categoria_id es NOT NULL: si el cliente no elige, usar la primera disponible.
    categoria_id = data.categoria_id
    if not categoria_id:
        primera = db.query(CategoriaCarga).first()
        if not primera:
            raise HTTPException(status_code=400,
                                detail="No hay categorias de carga configuradas")
        categoria_id = primera.id

    # Destino que indica el cliente (a donde ira el pedido).
    destino = data.destino_personalizado
    if not destino and (data.destino_departamento or data.destino_ciudad or data.destino_direccion):
        destino = ", ".join(x for x in [data.destino_direccion, data.destino_ciudad,
                                        data.destino_departamento] if x)

    solicitud = SolicitudCotizacion(
        usuario_id             = current_user.id,
        categoria_id           = categoria_id,
        ruta_id                = data.ruta_id,
        origen_personalizado   = data.origen_personalizado,
        destino_personalizado  = destino,
        tipo_ruta              = data.tipo_ruta,
        ambito                 = ambito,
        peso_kg                = data.peso_kg,
        volumen_m3             = data.volumen_m3,
        cantidad_unidades      = data.cantidad_unidades,
        descripcion_carga      = data.descripcion_carga,
        requiere_refrigeracion = data.requiere_refrigeracion,
        carga_fragil           = data.carga_fragil,
        carga_peligrosa        = data.carga_peligrosa,
        estado                 = "pendiente",
    )
    db.add(solicitud)
    db.flush()  # obtiene solicitud.id sin cerrar la transaccion

    # Prioridad la decide el cliente (binaria: prioritario o normal).
    prioritario = bool(data.es_prioritario)
    solicitud.prioridad = 1 if prioritario else 0

    # #6: generar tracking AUTOMATICAMENTE al crear el pedido.
    depto = data.destino_departamento or data.destino_ciudad or ""
    tracking = TrackingPedido(
        solicitud_id   = solicitud.id,
        numero_rastreo = generar_numero_rastreo(depto, current_user.id),
        estado         = "en_almacen" if prioritario else "pendiente",
    )
    db.add(tracking)
    db.flush()

    # Primer nodo del recorrido (lista enlazada / pila de estados).
    db.add(TrackingEvento(tracking_id=tracking.id, descripcion="Pedido creado", orden=1))
    if prioritario:
        db.add(TrackingEvento(tracking_id=tracking.id,
                              descripcion="En almacen — empacando (prioritario)", orden=2))

    db.commit()
    db.refresh(solicitud)

    # Encolar en la Cola (FIFO) y la Cola de prioridad.
    gestor.encolar_pedido(solicitud)

    return {
        "message": "Pedido creado exitosamente",
        "id": solicitud.id,
        "numero_rastreo": tracking.numero_rastreo,
        "ambito": ambito,
        "prioridad": solicitud.prioridad,
    }

@router.get("/mis-solicitudes")
def mis_solicitudes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    solicitudes = db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.usuario_id == current_user.id
    ).order_by(SolicitudCotizacion.creado_en.desc()).all()
    salida = []
    for s in solicitudes:
        tracking = db.query(TrackingPedido).filter(
            TrackingPedido.solicitud_id == s.id).first()
        salida.append({
            "id": s.id,
            "estado": s.estado,
            "ambito": s.ambito,
            "prioridad": s.prioridad,
            "descripcion_carga": s.descripcion_carga,
            "destino": s.destino_personalizado,
            "numero_rastreo": tracking.numero_rastreo if tracking else None,
            "creado_en": s.creado_en,
        })
    return salida
