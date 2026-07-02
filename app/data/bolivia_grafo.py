"""Grafo de ciudades de Bolivia + algoritmo A* para Envios Nacionales.

Se usa para dibujar la ruta calculada por A* sobre el mapa del dashboard (#6).
No es routing real de calles: es un grafo curado de las principales ciudades y
sus tramos carreteros. A* devuelve la secuencia de ciudades (con lat/lng) del
camino mas corto entre origen y destino usando la distancia haversine como costo
y como heuristica.
"""
from __future__ import annotations

import math
from heapq import heappush, heappop
from typing import Optional

# Nodo -> (lat, lng)
CIUDADES: dict[str, tuple[float, float]] = {
    "La Paz":     (-16.5000, -68.1500),
    "El Alto":    (-16.5040, -68.1633),
    "Oruro":      (-17.9833, -67.1500),
    "Cochabamba": (-17.3895, -66.1568),
    "Santa Cruz": (-17.7833, -63.1821),
    "Sucre":      (-19.0333, -65.2627),
    "Potosi":     (-19.5836, -65.7531),
    "Tarija":     (-21.5355, -64.7296),
    "Trinidad":   (-14.8333, -64.9000),
    "Cobija":     (-11.0267, -68.7692),
}

# Tramos carreteros principales (no dirigidos).
ARISTAS: list[tuple[str, str]] = [
    ("La Paz", "El Alto"),
    ("El Alto", "Oruro"),
    ("Oruro", "Cochabamba"),
    ("Oruro", "Potosi"),
    ("Cochabamba", "Santa Cruz"),
    ("Cochabamba", "Sucre"),
    ("Potosi", "Sucre"),
    ("Potosi", "Tarija"),
    ("Sucre", "Santa Cruz"),
    ("Santa Cruz", "Trinidad"),
    ("Cochabamba", "Trinidad"),
    ("La Paz", "Cobija"),
]

# Alias comunes -> nombre canonico del nodo.
_ALIAS = {
    "lapaz": "La Paz",
    "elalto": "El Alto",
    "santacruz": "Santa Cruz",
    "santacruzdelasierra": "Santa Cruz",
    "potosi": "Potosi",
    "potosí": "Potosi",
    "cochabamba": "Cochabamba",
    "oruro": "Oruro",
    "sucre": "Sucre",
    "tarija": "Tarija",
    "trinidad": "Trinidad",
    "cobija": "Cobija",
}


def _norm(txt: str) -> str:
    return "".join(c for c in (txt or "").lower() if c.isalnum())


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distancia en km entre dos (lat, lng)."""
    r = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def _grafo() -> dict[str, list[str]]:
    g: dict[str, list[str]] = {c: [] for c in CIUDADES}
    for u, v in ARISTAS:
        g[u].append(v)
        g[v].append(u)
    return g


def resolver_nodo(ciudad: Optional[str], pais: Optional[str] = None) -> Optional[str]:
    """Mapea un nombre de ciudad (o pais) al nodo del grafo mas parecido."""
    key = _norm(ciudad)
    if key and key in _ALIAS:
        return _ALIAS[key]
    # Coincidencia por substring del nombre canonico.
    for nombre in CIUDADES:
        if key and (_norm(nombre) in key or key in _norm(nombre)):
            return nombre
    return None


def astar(origen: str, destino: str) -> list[str]:
    """Camino mas corto (lista de nodos) entre dos ciudades del grafo."""
    if origen not in CIUDADES or destino not in CIUDADES:
        return []
    if origen == destino:
        return [origen]

    g = _grafo()
    meta = CIUDADES[destino]
    open_heap: list[tuple[float, str]] = []
    heappush(open_heap, (0.0, origen))
    came_from: dict[str, str] = {}
    g_score = {origen: 0.0}

    while open_heap:
        _, actual = heappop(open_heap)
        if actual == destino:
            camino = [actual]
            while actual in came_from:
                actual = came_from[actual]
                camino.append(actual)
            return list(reversed(camino))
        for vecino in g[actual]:
            tentativo = g_score[actual] + haversine(CIUDADES[actual], CIUDADES[vecino])
            if tentativo < g_score.get(vecino, math.inf):
                came_from[vecino] = actual
                g_score[vecino] = tentativo
                f = tentativo + haversine(CIUDADES[vecino], meta)
                heappush(open_heap, (f, vecino))
    return []


def ruta_waypoints(origen_ciudad: Optional[str], origen_pais: Optional[str],
                   destino_ciudad: Optional[str], destino_pais: Optional[str]) -> dict:
    """Devuelve los waypoints A* para una ruta. Estructura lista para el mapa:
        {"nodos": ["La Paz", ...],
         "waypoints": [{"nombre","lat","lng"}, ...],
         "distancia_km": float,
         "resuelto": bool}
    Si no se pueden resolver los nodos (ruta internacional o ciudad desconocida)
    devuelve resuelto=False con lista vacia (el mapa hara fallback)."""
    origen = resolver_nodo(origen_ciudad, origen_pais)
    destino = resolver_nodo(destino_ciudad, destino_pais)
    if not origen or not destino:
        return {"nodos": [], "waypoints": [], "distancia_km": 0.0, "resuelto": False}

    nodos = astar(origen, destino)
    if not nodos:
        return {"nodos": [], "waypoints": [], "distancia_km": 0.0, "resuelto": False}

    waypoints = [{"nombre": n, "lat": CIUDADES[n][0], "lng": CIUDADES[n][1]} for n in nodos]
    dist = sum(haversine(CIUDADES[nodos[i]], CIUDADES[nodos[i + 1]])
               for i in range(len(nodos) - 1))
    return {"nodos": nodos, "waypoints": waypoints,
            "distancia_km": round(dist, 1), "resuelto": True}
