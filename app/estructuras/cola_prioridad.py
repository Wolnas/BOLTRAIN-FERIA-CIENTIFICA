"""Cola de prioridad (implementacion propia por insercion ordenada).

Cada elemento entra con una prioridad; el `desencolar` devuelve siempre el de
MAYOR prioridad. A igual prioridad se respeta el orden de llegada (FIFO), por lo
que la insercion se hace antes del primer nodo con prioridad estrictamente menor.
"""
from __future__ import annotations

from typing import Any, Optional


class _NodoPrioridad:
    def __init__(self, valor: Any, prioridad: int):
        self.valor = valor
        self.prioridad = prioridad
        self.siguiente: Optional["_NodoPrioridad"] = None


class ColaPrioridad:
    def __init__(self):
        self.cabeza: Optional[_NodoPrioridad] = None
        self._tamano = 0

    def encolar(self, valor: Any, prioridad: int = 0) -> None:
        """Inserta manteniendo el orden descendente por prioridad."""
        nodo = _NodoPrioridad(valor, prioridad)
        # Va al frente si la lista esta vacia o supera a la cabeza actual.
        if self.cabeza is None or prioridad > self.cabeza.prioridad:
            nodo.siguiente = self.cabeza
            self.cabeza = nodo
        else:
            actual = self.cabeza
            # Avanza mientras el siguiente tenga prioridad >= la nueva (FIFO en empates).
            while (actual.siguiente is not None
                   and actual.siguiente.prioridad >= prioridad):
                actual = actual.siguiente
            nodo.siguiente = actual.siguiente
            actual.siguiente = nodo
        self._tamano += 1

    def desencolar(self) -> Any:
        """Saca y devuelve el elemento de mayor prioridad. None si esta vacia."""
        if self.cabeza is None:
            return None
        nodo = self.cabeza
        self.cabeza = nodo.siguiente
        self._tamano -= 1
        return nodo.valor

    def frente(self) -> Any:
        return self.cabeza.valor if self.cabeza else None

    def esta_vacia(self) -> bool:
        return self.cabeza is None

    def a_lista(self) -> list:
        """Elementos de mayor a menor prioridad, cada uno como (valor, prioridad)."""
        salida = []
        actual = self.cabeza
        while actual is not None:
            salida.append((actual.valor, actual.prioridad))
            actual = actual.siguiente
        return salida

    def __len__(self) -> int:
        return self._tamano
