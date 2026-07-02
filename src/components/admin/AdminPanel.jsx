import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import RutaMapa from './RutaMapa';

// Paleta negro/dorado consistente con la marca Boltrain.
const GOLD = '#D4AF37';
const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: {
    background: '#121212', border: `1px solid ${GOLD}`, borderRadius: 14,
    padding: 20,
  },
  h3: { color: GOLD, margin: '0 0 14px', fontWeight: 700, letterSpacing: 0.5 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 150 },
  label: { color: '#8A8A8A', fontSize: 12 },
  input: {
    background: '#0B0B0B', border: '1px solid #333', borderRadius: 8,
    color: '#F5F5F5', padding: '10px 12px', fontSize: 14,
  },
  btn: {
    background: GOLD, color: '#000', border: 'none', borderRadius: 8,
    padding: '11px 20px', fontWeight: 700, cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', color: '#F5F5F5' },
  th: {
    textAlign: 'left', color: GOLD, borderBottom: `1px solid ${GOLD}`,
    padding: '8px 10px', fontSize: 13,
  },
  td: { padding: '8px 10px', borderBottom: '1px solid #222', fontSize: 13 },
  badge: (estado) => ({
    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    color: estado === 'finalizado' ? '#8A8A8A' : '#000',
    background: estado === 'en_curso' ? GOLD
      : estado === 'programado' ? '#C9A227' : '#333',
  }),
  msg: { color: GOLD, fontSize: 13, marginTop: 10 },
  empty: { color: '#8A8A8A', fontStyle: 'italic', padding: '10px' },
  btnGhost: {
    background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`,
    borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer',
    fontSize: 12,
  },
  codigo: {
    display: 'inline-block', background: '#0B0B0B', border: `1px dashed ${GOLD}`,
    borderRadius: 8, padding: '8px 16px', color: GOLD, fontWeight: 700,
    letterSpacing: 2, fontSize: 20, fontFamily: 'monospace',
  },
};

export default function AdminPanel({ solicitudInicial }) {
  const [usuarios, setUsuarios] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [mapaViaje, setMapaViaje] = useState(null); // viaje_id abierto en el mapa
  const [form, setForm] = useState({
    chofer_id: '', ruta_id: '', solicitud_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    salida_programada: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });
  const [msg, setMsg] = useState('');
  const [msgEmp, setMsgEmp] = useState('');
  const [nombreEmp, setNombreEmp] = useState('');

  const cargar = () => {
    api.get('/admin/usuarios').then(r => setUsuarios(r.data)).catch(() => {});
    api.get('/admin/choferes').then(r => setChoferes(r.data)).catch(() => {});
    api.get('/admin/rutas').then(r => setRutas(r.data)).catch(() => {});
    api.get('/admin/pedidos').then(r => setPedidos(r.data)).catch(() => {});
    api.get('/admin/viajes').then(r => setViajes(r.data)).catch(() => {});
    api.get('/admin/empresa').then(r => setEmpresa(r.data)).catch(() => {});
  };
  useEffect(cargar, []);

  // Si llega un pedido despachado para asignar, lo preselecciona en el formulario.
  useEffect(() => {
    if (!solicitudInicial) return;
    const ped = pedidos.find(p => String(p.id) === String(solicitudInicial));
    setForm(f => ({
      ...f,
      solicitud_id: String(solicitudInicial),
      ruta_id: ped ? String(ped.ruta_id) : f.ruta_id,
    }));
  }, [solicitudInicial, pedidos]);

  const crearEmpresa = async () => {
    setMsgEmp('');
    if (!nombreEmp.trim()) { setMsgEmp('Escribe el nombre de la empresa.'); return; }
    try {
      const r = await api.post('/admin/empresa', { nombre: nombreEmp.trim() });
      setEmpresa(r.data);
      setNombreEmp('');
      cargar();
    } catch (err) {
      setMsgEmp(err.response?.data?.detail || 'No se pudo crear la empresa');
    }
  };

  // Cuando el admin elige un pedido, sincroniza la ruta con la del pedido.
  const elegirPedido = (e) => {
    const solId = e.target.value;
    const ped = pedidos.find(p => String(p.id) === String(solId));
    setForm(f => ({
      ...f,
      solicitud_id: solId,
      ruta_id: ped ? String(ped.ruta_id) : f.ruta_id,
    }));
  };

  const asignar = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!form.chofer_id || !form.ruta_id || !form.fecha || !form.salida_programada) {
      setMsg('Completa chofer, ruta/pedido, fecha y hora de salida.');
      return;
    }
    try {
      await api.post('/admin/viajes', {
        chofer_id: Number(form.chofer_id),
        ruta_id: Number(form.ruta_id),
        solicitud_id: form.solicitud_id ? Number(form.solicitud_id) : null,
        fecha: form.fecha,
        salida_programada: form.salida_programada,
      });
      setMsg('✓ Viaje asignado correctamente');
      setForm({ ...form, chofer_id: '', ruta_id: '', solicitud_id: '' });
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error al asignar el viaje');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={S.wrap}>
      {mapaViaje && <RutaMapa viajeId={mapaViaje} onClose={() => setMapaViaje(null)} />}

      {/* ---- Mi empresa (codigo para choferes) ---- */}
      <div style={S.card}>
        <h3 style={S.h3}>Mi empresa</h3>
        {empresa ? (
          <div>
            <p style={{ color: '#8A8A8A', fontSize: 13, margin: '0 0 8px' }}>
              Comparte este código con tus choferes para que se registren en tu empresa
              desde BOLTRAIN DRIVE:
            </p>
            <span style={S.codigo}>{empresa.codigo}</span>
            <p style={{ color: '#F5F5F5', fontSize: 13, marginTop: 10 }}>{empresa.nombre}</p>
          </div>
        ) : (
          <div>
            <p style={{ color: '#8A8A8A', fontSize: 13, margin: '0 0 10px' }}>
              Aún no tienes empresa. Créala para obtener un código único.
            </p>
            <div style={S.row}>
              <div style={S.field}>
                <span style={S.label}>Nombre de la empresa</span>
                <input style={S.input} value={nombreEmp}
                       onChange={e => setNombreEmp(e.target.value)}
                       placeholder="Transportes La Paz S.R.L." />
              </div>
              <button type="button" style={S.btn} onClick={crearEmpresa}>Crear empresa</button>
            </div>
            {msgEmp && <p style={S.msg}>{msgEmp}</p>}
          </div>
        )}
      </div>

      {/* ---- Asignar viaje ---- */}
      <div style={S.card}>
        <h3 style={S.h3}>Asignar viaje a un chofer</h3>
        <form style={S.row} onSubmit={asignar}>
          <div style={S.field}>
            <span style={S.label}>Chofer</span>
            <select style={S.input} value={form.chofer_id} onChange={set('chofer_id')}>
              <option value="">Selecciona…</option>
              {choferes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div style={S.field}>
            <span style={S.label}>Pedido (Envíos Nacionales)</span>
            <select style={S.input} value={form.solicitud_id} onChange={elegirPedido}>
              <option value="">Sin pedido</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id} · {p.origen} → {p.destino} ({p.cliente})
                </option>
              ))}
            </select>
          </div>
          <div style={S.field}>
            <span style={S.label}>Ruta</span>
            <select style={S.input} value={form.ruta_id} onChange={set('ruta_id')}>
              <option value="">Selecciona…</option>
              {rutas.map(r => (
                <option key={r.id} value={r.id}>
                  {r.origen} → {r.destino}
                </option>
              ))}
            </select>
          </div>
          <div style={S.field}>
            <span style={S.label}>Fecha</span>
            <input type="date" style={S.input} value={form.fecha} onChange={set('fecha')} />
          </div>
          <div style={S.field}>
            <span style={S.label}>Hora de salida</span>
            <input type="datetime-local" style={S.input}
                   value={form.salida_programada} onChange={set('salida_programada')} />
          </div>
          <button type="submit" style={S.btn}>Asignar</button>
        </form>
        {choferes.length === 0 && (
          <p style={S.empty}>
            No hay choferes registrados aún. Regístralos desde la app BOLTRAIN DRIVE.
          </p>
        )}
        {msg && <p style={S.msg}>{msg}</p>}
      </div>

      {/* ---- Viajes asignados ---- */}
      <div style={S.card}>
        <h3 style={S.h3}>Viajes asignados</h3>
        {viajes.length === 0 ? <p style={S.empty}>Sin viajes todavía.</p> : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>#</th><th style={S.th}>Fecha</th>
              <th style={S.th}>Salida programada</th>
              <th style={S.th}>Chofer</th><th style={S.th}>Ruta</th>
              <th style={S.th}>Estado</th><th style={S.th}>Última posición</th>
              <th style={S.th}>Mapa</th>
            </tr></thead>
            <tbody>
              {viajes.map(v => (
                <tr key={v.id}>
                  <td style={S.td}>{v.id}</td>
                  <td style={S.td}>{v.fecha}</td>
                  <td style={S.td}>
                    {v.salida_programada
                      ? new Date(v.salida_programada).toLocaleString()
                      : '—'}
                  </td>
                  <td style={S.td}>{v.chofer}</td>
                  <td style={S.td}>{v.ruta}</td>
                  <td style={S.td}><span style={S.badge(v.estado)}>{v.estado}</span></td>
                  <td style={S.td}>
                    {v.ultima_lat
                      ? `${v.ultima_lat.toFixed(4)}, ${v.ultima_lng.toFixed(4)}`
                      : '—'}
                  </td>
                  <td style={S.td}>
                    <button style={S.btnGhost} onClick={() => setMapaViaje(v.id)}>
                      Ver ruta A*
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ---- Usuarios de mi empresa ---- */}
      <div style={S.card}>
        <h3 style={S.h3}>Usuarios de mi empresa ({usuarios.length})</h3>
        {usuarios.length === 0 ? <p style={S.empty}>Sin usuarios.</p> : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Nombre</th><th style={S.th}>Email</th>
              <th style={S.th}>Tipo</th><th style={S.th}>Empresa</th>
            </tr></thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={S.td}>{u.nombre} {u.apellido}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.tipo_usuario}</td>
                  <td style={S.td}>{u.empresa || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
