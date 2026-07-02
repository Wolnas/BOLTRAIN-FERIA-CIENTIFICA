"""Lista enlazada simple (implementacion propia).

Usada como estructura base de la Cola y para modelar el recorrido del paquete
(cada nodo es un checkpoint/evento del envio, en orden de avance).
"""
from __future__ import annotations

from typing import Any, Iterator, Optional


class Nodo:
    """Nodo de la lista: guarda un valor y apunta al siguiente."""

    def __init__(self, valor: Any):
        self.valor = valor
        self.siguiente: Optional["Nodo"] = None


class ListaEnlazada:
    """Lista enlazada simple con insercion al final en O(1) (mantiene cola)."""

    def __init__(self):
        self.cabeza: Optional[Nodo] = None
        self.cola: Optional[Nodo] = None
        self._tamano = 0

    def esta_vacia(self) -> bool:
        return self.cabeza is None

    def agregar(self, valor: Any) -> None:
        """Inserta al final (append)."""
        nodo = Nodo(valor)
        if self.cabeza is None:
            self.cabeza = self.cola = nodo
        else:
            self.cola.siguiente = nodo  # type: ignore[union-attr]
            self.cola = nodo
        self._tamano += 1

    def agregar_inicio(self, valor: Any) -> None:
        """Inserta al principio (prepend)."""
        nodo = Nodo(valor)
        nodo.siguiente = self.cabeza
        self.cabeza = nodo
        if self.cola is None:
            self.cola = nodo
        self._tamano += 1

    def quitar_inicio(self) -> Any:
        """Extrae y devuelve el primer valor (None si esta vacia)."""
        if self.cabeza is None:
            return None
        nodo = self.cabeza
        self.cabeza = nodo.siguiente
        if self.cabeza is None:
            self.cola = None
        self._tamano -= 1
        return nodo.valor

    def a_lista(self) -> list:
        return [v for v in self]

    def __iter__(self) -> Iterator[Any]:
        actual = self.cabeza
        while actual is not None:
            yield actual.valor
            actual = actual.siguiente

    def __len__(self) -> int:
        return self._tamano
