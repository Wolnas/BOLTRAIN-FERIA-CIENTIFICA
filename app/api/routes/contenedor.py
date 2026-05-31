from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.contenedor import CategoriaCarga, Ruta, SolicitudCotizacion
from app.schemas.contenedor import CategoriaResponse, RutaResponse, SolicitudCreate
from app.models.usuario import Usuario

router = APIRouter(prefix="/contenedor", tags=["contenedor"])

@router.get("/categorias", response_model=List[CategoriaResponse])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaCarga).all()

@router.get("/rutas", response_model=List[RutaResponse])
def get_rutas(db: Session = Depends(get_db)):
    return db.query(Ruta).filter(Ruta.activa == True).all()

@router.post("/solicitud")
def crear_solicitud(
    data: SolicitudCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    solicitud = SolicitudCotizacion(
        usuario_id             = current_user.id,
        categoria_id           = data.categoria_id,
        ruta_id                = data.ruta_id,
        origen_personalizado   = data.origen_personalizado,
        destino_personalizado  = data.destino_personalizado,
        tipo_ruta              = data.tipo_ruta,
        peso_kg                = data.peso_kg,
        volumen_m3             = data.volumen_m3,
        cantidad_unidades      = data.cantidad_unidades,
        descripcion_carga      = data.descripcion_carga,
        requiere_refrigeracion = data.requiere_refrigeracion,
        carga_fragil           = data.carga_fragil,
        carga_peligrosa        = data.carga_peligrosa,
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return {"message": "Solicitud creada exitosamente", "id": solicitud.id}

@router.get("/mis-solicitudes")
def mis_solicitudes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return db.query(SolicitudCotizacion).filter(
        SolicitudCotizacion.usuario_id == current_user.id
    ).all()