from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class Empresa(Base):
    """Empresa creada por un admin. Su `codigo` unico permite que los choferes se
    unan a ella al registrarse (o queden 'libres' si no ingresan codigo)."""
    __tablename__ = "empresas"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    nombre    = Column(String(150), nullable=False)
    codigo    = Column(String(12), nullable=False, unique=True)
    admin_id  = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, server_default=func.now())
