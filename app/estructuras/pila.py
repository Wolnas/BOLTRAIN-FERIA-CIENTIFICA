"""Pila LIFO (implementacion propia).

Modela el historial de estados de la mercancia: el ultimo estado apilado es el
`tope` (estado actual) y el historial se lee del mas reciente al mas antiguo.
"""
from __future__ import annotations

from typing import Any, Optional


class _NodoPila:
    def __init__(self, valor: Any):
        self.valor = valor
        self.anterior: Optional["_NodoPila"] = None


class Pila:
    def __init__(self):
        self._tope: Optional[_NodoPila] = None
        self._tamano = 0

    def apilar(self, valor: Any) -> None:
        """Pone un elemento en el tope (push)."""
        nodo = _NodoPila(valor)
        nodo.anterior = self._tope
        self._tope = nodo
        self._tamano += 1

    def desapilar(self) -> Any:
        """Saca y devuelve el elemento del tope (pop). None si esta vacia."""
        if self._tope is None:
            return None
        nodo = self._tope
        self._tope = nodo.anterior
        self._tamano -= 1
        return nodo.valor

    def tope(self) -> Any:
        """Estado actual (elemento del tope) sin sacarlo."""
        return self._tope.valor if self._tope else None

    def esta_vacia(self) -> bool:
        return self._tope is None

    def a_lista(self) -> list:
        """Historial del mas reciente (tope) al mas antiguo (LIFO)."""
        salida = []
        actual = self._tope
        while actual is not None:
            salida.append(actual.valor)
            actual = actual.anterior
        return salida

    def __len__(self) -> int:
        return self._tamano
