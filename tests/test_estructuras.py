"""Pruebas de las estructuras de datos propias (Estructura de Datos 1).

Ejecutar:  venv/bin/python tests/test_estructuras.py    (o con pytest si esta instalado)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.estructuras import Cola, ColaPrioridad, Pila, ListaEnlazada  # noqa: E402


def test_lista_enlazada():
    ll = ListaEnlazada()
    assert ll.esta_vacia()
    for i in range(3):
        ll.agregar(i)
    assert ll.a_lista() == [0, 1, 2]
    assert len(ll) == 3
    assert ll.quitar_inicio() == 0
    assert ll.a_lista() == [1, 2]
    ll.agregar_inicio(9)
    assert ll.a_lista() == [9, 1, 2]


def test_cola_fifo():
    c = Cola()
    assert c.esta_vacia()
    for x in ("a", "b", "c"):
        c.encolar(x)
    assert c.frente() == "a"
    assert c.desencolar() == "a"      # FIFO
    assert c.desencolar() == "b"
    assert len(c) == 1


def test_cola_prioridad():
    cp = ColaPrioridad()
    cp.encolar("nac1", 0)
    cp.encolar("intl", 2)
    cp.encolar("nac2", 0)             # empate: respeta orden de llegada
    cp.encolar("urgente", 3)
    assert [v for v, _ in cp.a_lista()] == ["urgente", "intl", "nac1", "nac2"]
    assert cp.desencolar() == "urgente"   # mayor prioridad primero
    assert cp.frente() == "intl"


def test_pila_lifo():
    p = Pila()
    for s in ("creado", "confirmado", "en_transito"):
        p.apilar(s)
    assert p.tope() == "en_transito"
    assert p.a_lista() == ["en_transito", "confirmado", "creado"]  # LIFO
    assert p.desapilar() == "en_transito"
    assert p.tope() == "confirmado"


def _run():
    fallos = 0
    for nombre, fn in sorted(globals().items()):
        if nombre.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"  OK  {nombre}")
            except AssertionError as e:
                fallos += 1
                print(f" FAIL {nombre}: {e}")
    print("TODO OK" if fallos == 0 else f"{fallos} prueba(s) fallaron")
    return fallos


if __name__ == "__main__":
    sys.exit(1 if _run() else 0)
