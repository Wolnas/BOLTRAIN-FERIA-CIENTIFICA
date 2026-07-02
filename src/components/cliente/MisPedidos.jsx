import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { S } from './estilos';

// Lista de los pedidos del cliente con su número de tracking y acceso a rastrear.
export default function MisPedidos({ onRastrear }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    api.get('/contenedor/mis-solicitudes')
      .then(r => setPedidos(r.data))
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h3 style={S.h3}>Mis pedidos ({pedidos.length})</h3>
        {cargado && pedidos.length === 0 ? (
          <p style={S.empty}>Aún no tienes pedidos. Crea uno desde "Crear Pedido".</p>
        ) : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>Descripción</th>
              <th style={S.th}>Ámbito</th><th style={S.th}>Destino</th>
              <th style={S.th}>Estado</th><th style={S.th}>Tracking</th>
              <th style={S.th}></th>
            </tr></thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.id}</td>
                  <td style={S.td}>{p.descripcion_carga || '—'}</td>
                  <td style={S.td}><span style={S.badge(p.ambito)}>{p.ambito}</span></td>
                  <td style={S.td}>{p.destino || '—'}</td>
                  <td style={S.td}>{p.estado}</td>
                  <td style={S.td} title={p.numero_rastreo || ''}>
                    <code style={{ color: '#D4AF37' }}>{p.numero_rastreo || '—'}</code>
                  </td>
                  <td style={S.td}>
                    {p.numero_rastreo && (
                      <button style={S.btnGhost}
                              onClick={() => onRastrear && onRastrear(p.numero_rastreo)}>
                        Rastrear
                      </button>
                    )}
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
