"""Estructuras de datos propias del proyecto (Estructura de Datos 1).

Implementaciones desde cero (sin usar list/deque/heapq de Python) para el
manejo de pedidos y del recorrido/estado de la mercancia:
  - ListaEnlazada : base; recorrido del paquete.
  - Cola          : FIFO; pedidos en espera de asignacion.
  - ColaPrioridad : asignacion por prioridad.
  - Pila          : LIFO; historial de estados de la mercancia.
"""
from app.estructuras.lista_enlazada import Nodo, ListaEnlazada
from app.estructuras.cola import Cola
from app.estructuras.cola_prioridad import ColaPrioridad
from app.estructuras.pila import Pila

__all__ = ["Nodo", "ListaEnlazada", "Cola", "ColaPrioridad", "Pila"]
