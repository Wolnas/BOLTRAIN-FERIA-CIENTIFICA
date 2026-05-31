from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random, string
from app.api.deps import get_db, get_current_user
from app.models.pedido import Direccion, TrackingPedido
from app.models.usuario import Usuario
from app.models.contenedor import SolicitudCotizacion
from app.schemas.pedido import DireccionCreate, DireccionResponse, TrackingResponse, CODIGOS_POSTALES

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