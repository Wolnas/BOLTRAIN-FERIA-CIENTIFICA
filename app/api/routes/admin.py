"""Rutas solo para administradores (protegidas con get_current_admin).

El admin gestiona SU empresa: ve los usuarios/choferes de su empresa y asigna
viajes (ruta + fecha) a los choferes. Si el admin no tiene empresa asignada
(empresa = NULL) actua como super-admin y ve todo.
"""
import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.models.contenedor import Ruta, SolicitudCotizacion
from app.models.pedido import TrackingPedido
from app.models.viaje import Viaje
from app.schemas.viaje import ViajeCreate
from app.schemas.empresa import EmpresaCreate

router = APIRouter(prefix="/admin", tags=["admin"])

_PAIS_NACIONAL = "bolivia"


def _generar_codigo_empresa(db: Session) -> str:
    """Codigo unico BT-EMP-XXXX para que los choferes se unan a la empresa."""
    for _ in range(20):
        codigo = "BT-EMP-" + "".join(
            random.choices(string.ascii_uppercase + string.digits, k=4))
        if not db.query(Empresa).filter(Empresa.codigo == codigo).first():
            return codigo
    raise HTTPException(status_code=500, detail="No se pudo generar un codigo unico")


@router.post("/empresa")
def crear_empresa(data: EmpresaCreate, db: Session = Depends(get_db),
                  admin: Usuario = Depends(get_current_admin)):
    """#7: el admin crea su empresa y obtiene el codigo para repartir a choferes."""
    existente = None
    if admin.empresa_id:
        existente = db.query(Empresa).filter(Empresa.id == admin.empresa_id).first()
    if existente:
        raise HTTPException(status_code=400,
                            detail="Ya tienes una empresa creada")

    empresa = Empresa(nombre=data.nombre.strip(),
                      codigo=_generar_codigo_empresa(db),
                      admin_id=admin.id)
    db.add(empresa)
    db.commit()
    db.refresh(empresa)

    # Enlaza al admin con su empresa recien creada.
    admin.empresa = empresa.nombre
    admin.empresa_id = empresa.id
    db.commit()
    return {"id": empresa.id, "nombre": empresa.nombre, "codigo": empresa.codigo}


@router.get("/empresa")
def mi_empresa(db: Session = Depends(get_db),
               admin: Usuario = Depends(get_current_admin)):
    """Devuelve la empresa (y su codigo) del admin, o null si no tiene."""
    if not admin.empresa_id:
        return None
    empresa = db.query(Empresa).filter(Empresa.id == admin.empresa_id).first()
    if not empresa:
        return None
    return {"id": empresa.id, "nombre": empresa.nombre, "codigo": empresa.codigo}


def _scoped_usuarios(db: Session, admin: Usuario):
    """Query de usuarios acotada a la empresa del admin (o todos si es super)."""
    q = db.query(Usuario)
    if admin.empresa:
        q = q.filter(Usuario.empresa == admin.empresa)
    return q


@router.get("/usuarios")
def listar_usuarios(db: Session = Depends(get_db),
                    admin: Usuario = Depends(get_current_admin)):
    """Usuarios de la empresa del admin."""
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "email": u.email,
            "tipo_usuario": u.tipo_usuario,
            "empresa": u.empresa,
            "telefono": u.telefono,
        }
        for u in _scoped_usuarios(db, admin).all()
    ]


@router.get("/choferes")
def listar_choferes(db: Session = Depends(get_db),
                    admin: Usuario = Depends(get_current_admin)):
    """Solo los transportistas (para el selector al asignar un viaje)."""
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "email": u.email,
            "empresa": u.empresa,
        }
        for u in _scoped_usuarios(db, admin)
        .filter(Usuario.tipo_usuario == "transportista").all()
    ]


@router.get("/rutas")
def listar_rutas(db: Session = Depends(get_db),
                 admin: Usuario = Depends(get_current_admin)):
    """Rutas activas disponibles para asignar."""
    return [
        {
            "id": r.id,
            "origen": f"{r.origen_ciudad or ''} {r.origen_pais}".strip(),
            "destino": f"{r.destino_ciudad or ''} {r.destino_pais}".strip(),
            "tiempo_estimado": r.tiempo_estimado,
        }
        for r in db.query(Ruta).filter(Ruta.activa == True).all()  # noqa: E712
    ]


@router.get("/pedidos")
def listar_pedidos_nacionales(db: Session = Depends(get_db),
                              admin: Usuario = Depends(get_current_admin)):
    """#2: pedidos nacionales que AUN NO tienen chofer asignado (todos ellos).

    No se filtra por ruta: incluye los pedidos con destino personalizado."""
    salida = []
    solicitudes = (db.query(SolicitudCotizacion)
                   .filter(SolicitudCotizacion.ambito == "nacional")
                   .order_by(SolicitudCotizacion.creado_en.desc())
                   .all())
    for sol in solicitudes:
        # Solo los que no estan asignados todavia a un viaje/chofer.
        if db.query(Viaje).filter(Viaje.solicitud_id == sol.id).first():
            continue
        ruta = db.query(Ruta).filter(Ruta.id == sol.ruta_id).first() if sol.ruta_id else None
        cliente = db.query(Usuario).filter(Usuario.id == sol.usuario_id).first()
        origen = (f"{ruta.origen_ciudad or ''} {ruta.origen_pais}".strip()
                  if ruta else (sol.origen_personalizado or "Bolivia"))
        destino = (sol.destino_personalizado
                   or (f"{ruta.destino_ciudad or ''} {ruta.destino_pais}".strip()
                       if ruta else "-"))
        salida.append({
            "id": sol.id,
            "ruta_id": sol.ruta_id,
            "origen": origen,
            "destino": destino,
            "estado": sol.estado,
            "cliente": (f"{cliente.nombre} {cliente.apellido}" if cliente else "-"),
            "descripcion": sol.descripcion_carga,
        })
    return salida


@router.get("/despachados")
def listar_despachados(db: Session = Depends(get_db),
                       admin: Usuario = Depends(get_current_admin)):
    """Pedidos despachados desde almacen que aun NO tienen chofer asignado.

    Es el puente entre 'despachar' y 'asignar viaje a un chofer'."""
    salida = []
    q = (db.query(SolicitudCotizacion, TrackingPedido)
         .join(TrackingPedido, TrackingPedido.solicitud_id == SolicitudCotizacion.id)
         .filter(TrackingPedido.estado == "despachado"))
    for sol, tracking in q.all():
        ya_asignado = db.query(Viaje).filter(Viaje.solicitud_id == sol.id).first()
        if ya_asignado:
            continue
        ruta = db.query(Ruta).filter(Ruta.id == sol.ruta_id).first() if sol.ruta_id else None
        cliente = db.query(Usuario).filter(Usuario.id == sol.usuario_id).first()
        salida.append({
            "id": sol.id,
            "ruta_id": sol.ruta_id,
            "numero_rastreo": tracking.numero_rastreo,
            "destino": sol.destino_personalizado
                       or (f"{ruta.destino_ciudad or ''} {ruta.destino_pais}".strip()
                           if ruta else "-"),
            "cliente": f"{cliente.nombre} {cliente.apellido}" if cliente else "-",
            "descripcion": sol.descripcion_carga,
        })
    return salida


@router.post("/viajes")
def asignar_viaje(data: ViajeCreate, db: Session = Depends(get_db),
                  admin: Usuario = Depends(get_current_admin)):
    """El admin asigna un viaje (ruta + fecha + hora de salida) a un chofer."""
    chofer = db.query(Usuario).filter(
        Usuario.id == data.chofer_id,
        Usuario.tipo_usuario == "transportista",
    ).first()
    if not chofer:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    ruta = db.query(Ruta).filter(Ruta.id == data.ruta_id).first()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")

    if data.solicitud_id is not None:
        sol = db.query(SolicitudCotizacion).filter(
            SolicitudCotizacion.id == data.solicitud_id).first()
        if not sol:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

    viaje = Viaje(
        chofer_id=data.chofer_id,
        ruta_id=data.ruta_id,
        solicitud_id=data.solicitud_id,
        fecha=data.fecha,
        salida_programada=data.salida_programada,
        empresa=data.empresa or admin.empresa or chofer.empresa,
        estado="programado",
    )
    db.add(viaje)
    db.commit()
    db.refresh(viaje)
    return {"message": "Viaje asignado", "id": viaje.id}


@router.get("/viajes")
def listar_viajes(db: Session = Depends(get_db),
                  admin: Usuario = Depends(get_current_admin)):
    """Viajes asignados dentro de la empresa del admin."""
    q = db.query(Viaje)
    if admin.empresa:
        q = q.filter(Viaje.empresa == admin.empresa)

    salida = []
    for v in q.order_by(Viaje.fecha.desc(), Viaje.id.desc()).all():
        chofer = db.query(Usuario).filter(Usuario.id == v.chofer_id).first()
        ruta = db.query(Ruta).filter(Ruta.id == v.ruta_id).first()
        salida.append({
            "id": v.id,
            "fecha": v.fecha,
            "salida_programada": v.salida_programada,
            "solicitud_id": v.solicitud_id,
            "estado": v.estado,
            "empresa": v.empresa,
            "chofer": f"{chofer.nombre} {chofer.apellido}" if chofer else "-",
            "ruta": (f"{ruta.origen_pais} -> {ruta.destino_pais}"
                     if ruta else "-"),
            "ultima_lat": float(v.ultima_lat) if v.ultima_lat else None,
            "ultima_lng": float(v.ultima_lng) if v.ultima_lng else None,
            "ultima_pos_en": v.ultima_pos_en,
        })
    return salida
