from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, contenedor, pedido

app = FastAPI(title="BOLTRAIN API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contenedor.router)
app.include_router(pedido.router)

@app.get("/")
def root():
    return {"message": "BOLTRAIN API corriendo"}    