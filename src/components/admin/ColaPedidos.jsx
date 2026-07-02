import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { S, GOLD } from '../cliente/estilos';

// Visualización de las estructuras de datos:
//   - Cola de prioridad: el orden en que saldrán (se despachan de aquí).
//   - Cola normal (FIFO): llegada; el admin elige cuál priorizar (va a almacén).
export default function ColaPedidos({ onAsignar }) {
  const [cola, setCola] = useState({ tamano: 0, items: [] });
  const [prio, setPrio] = useState({ tamano: 0, items: [] });
  const [despachados, setDespachados] = useState([]);
  const [proceso, setProceso] = useState([]);
  const [msg, setMsg] = useState('');

  const cargar = useCallback(() => {
    api.get('/ds/cola').then(r => setCola(r.data)).catch(() => {});
    api.get('/ds/cola-prioridad').then(r => setPrio(r.data)).catch(() => {});
    api.get('/admin/despachados').then(r => setDespachados(r.data)).catch(() => {});
    api.get('/ds/en-proceso').then(r => setProceso(r.data)).catch(() => {});
  }, []);

  useEffect(cargar, [cargar]);

  const priorizar = async (sid) => {
    setMsg('');
    try {
      await api.post(`/ds/priorizar/${sid}`);
      setMsg(`Pedido #${sid} priorizado y enviado a almacén (se empaca primero).`);
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'No se pudo priorizar');
    }
  };

  const despachar = async (sid) => {
    setMsg('');
    try {
      const r = await api.post(`/ds/despachar/${sid}`);
      setMsg(`Pedido #${sid} despachado. Quedan ${r.data.quedan_en_cola} en cola.`);
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'No se pudo despachar');
    }
  };

  const entregar = async (sid) => {
    setMsg('');
    try {
      await api.post(`/ds/entregar/${sid}`);
      setMsg(`Pedido #${sid} marcado como entregado.`);
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'No se pudo entregar');
    }
  };

  const ESTADO_LABEL = {
    en_almacen: 'En almacén', despachado: 'Despachado',
    en_transito: 'En camino', en_aduana: 'En aduana', en_destino: 'En destino',
  };

  return (
    <div style={S.wrap}>
      {msg && <div style={{ ...S.card, padding: '12px 20px' }}><span style={S.msg}>{msg}</span></div>}

      {/* Despachados — listos para mandar a un chofer */}
      {despachados.length > 0 && (
        <div style={S.card}>
          <h3 style={S.h3}>Despachados — asignar a un chofer ({despachados.length})</h3>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Pedido #</th><th style={S.th}>Tracking</th>
              <th style={S.th}>Destino</th><th style={S.th}>Cliente</th>
              <th style={S.th}>Acción</th>
            </tr></thead>
            <tbody>
              {despachados.map(d => (
                <tr key={d.id}>
                  <td style={S.td}>{d.id}</td>
                  <td style={S.td}><code style={{ color: GOLD }}>{d.numero_rastreo}</code></td>
                  <td style={S.td}>{d.destino}</td>
                  <td style={S.td}>{d.cliente}</td>
                  <td style={S.td}>
                    <button style={S.btn} onClick={() => onAsignar && onAsignar(d.id)}>
                      Asignar a chofer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* En proceso (almacén / camino) — marcar entregado */}
      {proceso.length > 0 && (
        <div style={S.card}>
          <h3 style={S.h3}>En proceso — almacén / entrega ({proceso.length})</h3>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Pedido #</th><th style={S.th}>Tracking</th>
              <th style={S.th}>Estado</th><th style={S.th}>Destino</th>
              <th style={S.th}>Acción</th>
            </tr></thead>
            <tbody>
              {proceso.map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.id}</td>
                  <td style={S.td}><code style={{ color: GOLD }}>{p.numero_rastreo}</code></td>
                  <td style={S.td}>{ESTADO_LABEL[p.estado] || p.estado}</td>
                  <td style={S.td}>{p.destino}</td>
                  <td style={S.td}>
                    <button style={S.btn} onClick={() => entregar(p.id)}>Marcar entregado</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cola de prioridad — de aquí se despacha */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={S.h3}>Cola de prioridad — orden de salida (FIFO)</h3>
          <button style={S.btn} disabled={prio.items.length === 0 && cola.items.length === 0}
                  onClick={() => {
                    const sig = prio.items[0]?.pedido?.solicitud_id ?? cola.items[0]?.solicitud_id;
                    if (sig) despachar(sig);
                  }}>
            Despachar siguiente
          </button>
        </div>
        {prio.items.length === 0 ? <p style={S.empty}>Cola vacía.</p> : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Turno</th><th style={S.th}>Pedido #</th>
              <th style={S.th}>Ámbito</th><th style={S.th}>Descripción</th>
              <th style={S.th}>Prioridad</th><th style={S.th}>Acción</th>
            </tr></thead>
            <tbody>
              {prio.items.map((it, i) => (
                <tr key={i} style={i === 0 ? { background: 'rgba(212,175,55,0.10)' } : undefined}>
                  <td style={S.td}>{i + 1}º</td>
                  <td style={S.td}>{it.pedido.solicitud_id}</td>
                  <td style={S.td}>{it.pedido.ambito}</td>
                  <td style={S.td}>{it.pedido.descripcion || '—'}</td>
                  <td style={S.td}><b style={{ color: GOLD }}>{it.prioridad}</b></td>
                  <td style={S.td}>
                    <button style={S.btn} onClick={() => despachar(it.pedido.solicitud_id)}>
                      Despachar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cola normal (FIFO) — el admin elige cuál priorizar */}
      <div style={S.card}>
        <h3 style={S.h3}>Cola de llegada (FIFO) · {cola.tamano}</h3>
        {cola.items.length === 0 ? <p style={S.empty}>Cola vacía.</p> : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Posición</th><th style={S.th}>Pedido #</th>
              <th style={S.th}>Ámbito</th><th style={S.th}>Descripción</th>
              <th style={S.th}>Acción</th>
            </tr></thead>
            <tbody>
              {cola.items.map((it, i) => (
                <tr key={i}>
                  <td style={S.td}>{i === 0 ? 'frente' : i + 1}</td>
                  <td style={S.td}>{it.solicitud_id}</td>
                  <td style={S.td}>{it.ambito}</td>
                  <td style={S.td}>{it.descripcion || '—'}</td>
                  <td style={S.td}>
                    <button style={S.btnGhost} onClick={() => priorizar(it.solicitud_id)}>
                      Priorizar a almacén
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
