from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models  # noqa: F401  (registra el mapeo de todos los modelos)
from app.api.routes import auth, contenedor, pedido, admin, viajes, ds
from app.db.session import SessionLocal
from app.estructuras import gestor

app = FastAPI(title="BOLTRAIN API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # frontend React (dashboard)
        "http://localhost:5000",   # BOLTRAIN DRIVE en Flutter web (dev)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contenedor.router)
app.include_router(pedido.router)
app.include_router(admin.router)
app.include_router(viajes.router)
app.include_router(ds.router)


@app.on_event("startup")
def _cargar_colas():
    """Reconstruye la Cola y la Cola de prioridad desde los pedidos pendientes."""
    db = SessionLocal()
    try:
        gestor.reconstruir(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "BOLTRAIN API corriendo"}
