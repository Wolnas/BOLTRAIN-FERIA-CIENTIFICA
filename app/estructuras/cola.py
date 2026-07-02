"""Cola FIFO (implementacion propia sobre ListaEnlazada).

Modela los pedidos en espera de asignacion: el primero en llegar es el primero
en atenderse.
"""
from __future__ import annotations

from typing import Any

from app.estructuras.lista_enlazada import ListaEnlazada


class Cola:
    def __init__(self):
        self._items = ListaEnlazada()

    def encolar(self, valor: Any) -> None:
        """Agrega al final de la cola."""
        self._items.agregar(valor)

    def desencolar(self) -> Any:
        """Saca y devuelve el primer elemento (FIFO). None si esta vacia."""
        return self._items.quitar_inicio()

    def frente(self) -> Any:
        """Mira el primer elemento sin sacarlo."""
        return self._items.cabeza.valor if self._items.cabeza else None

    def esta_vacia(self) -> bool:
        return self._items.esta_vacia()

    def a_lista(self) -> list:
        """Elementos en orden de atencion (frente -> final)."""
        return self._items.a_lista()

    def __len__(self) -> int:
        return len(self._items)
