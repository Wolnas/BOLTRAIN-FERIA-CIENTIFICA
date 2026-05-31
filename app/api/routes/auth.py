from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioRegistro, UsuarioLogin, UsuarioResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(data: UsuarioRegistro, db: Session = Depends(get_db)):
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya esta registrado")
    user = Usuario(
        tipo_usuario  = data.tipo_usuario,
        nombre        = data.nombre,
        apellido      = data.apellido,
        email         = data.email,
        telefono      = data.telefono,
        pais          = data.pais,
        empresa       = data.empresa,
        password_hash = hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"token": token, "user": UsuarioResponse.from_orm(user)}

@router.post("/login")
def login(data: UsuarioLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = create_access_token({"sub": str(user.id)})
    return {"token": token, "user": UsuarioResponse.from_orm(user)}

@router.get("/me", response_model=UsuarioResponse)
def me(db: Session = Depends(get_db)):
    return {"message": "ruta protegida"}