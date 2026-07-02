import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { S } from './estilos';

// Pedidos de ámbito internacional (visibles para el cliente).
export default function PedidosInternacionales() {
  const [pedidos, setPedidos] = useState([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    api.get('/pedidos/internacionales')
      .then(r => setPedidos(r.data))
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h3 style={S.h3}>Pedidos internacionales ({pedidos.length})</h3>
        {cargado && pedidos.length === 0 ? (
          <p style={S.empty}>No hay pedidos internacionales por ahora.</p>
        ) : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>Descripción</th>
              <th style={S.th}>Destino</th><th style={S.th}>Estado</th>
              <th style={S.th}>Tracking</th><th style={S.th}>Creado</th>
            </tr></thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.solicitud_id}>
                  <td style={S.td}>{p.solicitud_id}</td>
                  <td style={S.td}>{p.descripcion || '—'}</td>
                  <td style={S.td}>{p.destino || '—'}</td>
                  <td style={S.td}>{p.estado}</td>
                  <td style={S.td}><code style={{ color: '#D4AF37' }}>{p.numero_rastreo || '—'}</code></td>
                  <td style={S.td}>{(p.creado_en || '').slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
