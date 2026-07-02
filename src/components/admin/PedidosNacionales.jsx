import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { S } from '../cliente/estilos';

// Pedidos nacionales asignables (usa /admin/pedidos, ya scoped por empresa del admin).
export default function PedidosNacionales() {
  const [pedidos, setPedidos] = useState([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    api.get('/admin/pedidos')
      .then(r => setPedidos(r.data))
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h3 style={S.h3}>Pedidos nacionales ({pedidos.length})</h3>
        {cargado && pedidos.length === 0 ? (
          <p style={S.empty}>No hay pedidos nacionales por ahora.</p>
        ) : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>Origen</th>
              <th style={S.th}>Destino</th><th style={S.th}>Cliente</th>
              <th style={S.th}>Estado</th><th style={S.th}>Descripción</th>
            </tr></thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.id}</td>
                  <td style={S.td}>{p.origen}</td>
                  <td style={S.td}>{p.destino}</td>
                  <td style={S.td}>{p.cliente}</td>
                  <td style={S.td}>{p.estado}</td>
                  <td style={S.td}>{p.descripcion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
