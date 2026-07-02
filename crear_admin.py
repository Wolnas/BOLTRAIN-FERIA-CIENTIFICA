"""Crea o promueve un usuario administrador de Boltrain.

Uso (con el venv activado, desde ~/Desktop/boltrain-frontend):
    python crear_admin.py                      # crea admin@boltrain.bo / admin1234
    python crear_admin.py correo@x.com clave123 "Nombre" "Apellido"

Si el email ya existe, solo lo marca como admin (es_admin = 1).
"""
import sys
from app.db.session import SessionLocal
from app.models.usuario import Usuario
from app.core.security import hash_password

email    = sys.argv[1] if len(sys.argv) > 1 else "admin@boltrain.bo"
password = sys.argv[2] if len(sys.argv) > 2 else "admin1234"
nombre   = sys.argv[3] if len(sys.argv) > 3 else "Admin"
apellido = sys.argv[4] if len(sys.argv) > 4 else "Boltrain"

db = SessionLocal()
try:
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user:
        user.es_admin = True
        db.commit()
        print(f"OK: '{email}' promovido a administrador (es_admin=1).")
    else:
        user = Usuario(
            tipo_usuario="cliente",   # el admin es un usuario con es_admin=1
            nombre=nombre,
            apellido=apellido,
            email=email,
            pais="Bolivia",
            password_hash=hash_password(password),
            es_admin=True,
        )
        db.add(user)
        db.commit()
        print(f"OK: administrador creado -> {email} / {password}")
finally:
    db.close()
