import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../services/api';
import { S, GOLD } from './estilos';
import './RastreoPedido.css';

// Pasos del recorrido mapeados desde el estado del tracking.
const PASOS = [
  { key: 'pendiente', label: 'Creado' },
  { key: 'en_almacen', label: 'En almacén' },
  { key: 'despachado', label: 'Despachado' },
  { key: 'en_transito', label: 'En camino' },
  { key: 'en_destino', label: 'En destino' },
  { key: 'entregado', label: 'Entregado' },
];
const ORDEN = { pendiente: 0, en_revision: 0, cotizado: 1, confirmado: 1,
  en_almacen: 1, despachado: 2, en_transito: 3, en_aduana: 3,
  en_destino: 4, entregado: 5 };

// Rastreo por estados (sin mapa en tiempo real, por seguridad). Se apoya en la
// Pila del backend: cada avance del pedido apila un estado (el tope es el actual).
export default function RastreoPedido({ numeroInicial }) {
  const [numero, setNumero] = useState(numeroInicial || '');
  const [buscado, setBuscado] = useState(numeroInicial || '');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const timer = useRef(null);

  const consultar = useCallback((num) => {
    if (!num) return;
    api.get(`/pedidos/rastrear/${num}`)
      .then(r => { setData(r.data); setErr(''); })
      .catch(() => { setErr('No se encontró ese número de tracking.'); setData(null); });
  }, []);

  // Refresca los estados cada 5s (por si el chofer avanza el pedido).
  useEffect(() => {
    if (!buscado) return undefined;
    consultar(buscado);
    timer.current = setInterval(() => consultar(buscado), 5000);
    return () => clearInterval(timer.current);
  }, [buscado, consultar]);

  useEffect(() => {
    if (numeroInicial) { setNumero(numeroInicial); setBuscado(numeroInicial); }
  }, [numeroInicial]);

  const buscar = (e) => {
    e.preventDefault();
    setData(null); setErr('');
    setBuscado(numero.trim().toUpperCase());
  };

  const idx = data ? (ORDEN[data.estado_tracking] ?? 0) : -1;
  const enCamino = data && idx >= 3;

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h3 style={S.h3}>Rastrear pedido</h3>
        <form style={S.row} onSubmit={buscar}>
          <div style={S.field}>
            <span style={S.label}>Número de tracking</span>
            <input style={S.input} value={numero}
                   onChange={e => setNumero(e.target.value)}
                   placeholder="BT-SC-XXXXXXXX" />
          </div>
          <button type="submit" style={S.btn}>Rastrear</button>
        </form>
        {err && <p style={{ ...S.msg, color: '#e74c3c' }}>{err}</p>}
      </div>

      {data && (
        <div style={S.card} className="bt-track">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ color: '#8A8A8A', fontSize: 12 }}>Tracking</span>
              <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 20, fontWeight: 700 }}>
                {data.numero_rastreo}
              </div>
              {data.destino && (
                <div style={{ color: '#8A8A8A', fontSize: 12, marginTop: 2 }}>Destino: {data.destino}</div>
              )}
            </div>
            {enCamino
              ? <span className="bt-moving">Tu paquete ya está en camino</span>
              : <span style={{ color: '#8A8A8A', fontSize: 13 }}>Tu pedido está en preparación</span>}
          </div>

          {/* Timeline animado de estados */}
          <div className="bt-timeline">
            {PASOS.map((p, i) => (
              <div key={p.key} className={`bt-step ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}>
                <div className="bt-step__dot" />
                <div className="bt-step__label">{p.label}</div>
              </div>
            ))}
          </div>

          {/* Historial (pila LIFO: más reciente arriba) */}
          <div>
            <div style={{ ...S.h3, fontSize: 14 }}>Historial de estados</div>
            {(data.historial || []).map((h, i) => (
              <div key={i} className="bt-hist-item"
                   style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #222' }}>
                <span style={{ color: i === 0 ? GOLD : '#8A8A8A', fontWeight: i === 0 ? 700 : 400 }}>
                  {i === 0 ? '● ' : '○ '}{h.descripcion}
                </span>
                <span style={{ color: '#666', fontSize: 12, marginLeft: 'auto' }}>{h.creado_en}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
