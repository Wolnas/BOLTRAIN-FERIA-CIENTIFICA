import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { S, GOLD } from './estilos';

const DEPARTAMENTOS = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro',
  'Potosi', 'Chuquisaca', 'Tarija', 'Beni', 'Pando'];

const VACIO = {
  ambito: 'nacional', categoria_id: '', descripcion_carga: '',
  peso_kg: '', volumen_m3: '', cantidad_unidades: '',
  requiere_refrigeracion: false, carga_fragil: false, carga_peligrosa: false,
  es_prioritario: false,
  destino_departamento: '', destino_ciudad: '', destino_direccion: '',
};

// Formulario del cliente para crear un pedido; al crearlo el backend genera el
// tracking automáticamente y lo encola (cola / cola de prioridad).
export default function CrearPedido({ onRastrear }) {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState(null); // { numero_rastreo, prioridad, ambito }

  useEffect(() => {
    api.get('/contenedor/categorias').then(r => setCategorias(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.descripcion_carga.trim()) { alert('Describe la carga.'); return; }
    if (!form.destino_departamento) { alert('Indica el departamento de destino.'); return; }
    setEnviando(true);
    try {
      const r = await api.post('/contenedor/solicitud', {
        ...form,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        peso_kg: parseFloat(form.peso_kg) || null,
        volumen_m3: parseFloat(form.volumen_m3) || null,
        cantidad_unidades: parseInt(form.cantidad_unidades, 10) || null,
      });
      setCreado(r.data);
      setForm(VACIO);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al crear el pedido');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={S.wrap}>
      {creado && (
        <div style={{ ...S.card, borderColor: '#2ecc71' }}>
          <h3 style={{ ...S.h3, color: '#2ecc71' }}>Pedido creado</h3>
          <p style={{ color: '#F5F5F5', fontSize: 14, margin: '0 0 10px' }}>
            Tu número de tracking (generado automáticamente):
          </p>
          <span style={S.codigo}>{creado.numero_rastreo}</span>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 10 }}>
            Ámbito: {creado.ambito} · Prioridad: {creado.prioridad}
          </p>
          <button style={{ ...S.btn, marginTop: 12 }}
                  onClick={() => onRastrear && onRastrear(creado.numero_rastreo)}>
            Rastrear este pedido
          </button>
        </div>
      )}

      <div style={S.card}>
        <h3 style={S.h3}>Crear pedido</h3>
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={S.row}>
            <div style={S.field}>
              <span style={S.label}>Ámbito</span>
              <select style={S.input} value={form.ambito} onChange={set('ambito')}>
                <option value="nacional">Nacional</option>
                <option value="internacional">Internacional</option>
              </select>
            </div>
            <div style={S.field}>
              <span style={S.label}>Categoría</span>
              <select style={S.input} value={form.categoria_id} onChange={set('categoria_id')}>
                <option value="">General</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={S.field}>
            <span style={S.label}>Descripción de la carga</span>
            <input style={S.input} value={form.descripcion_carga}
                   onChange={set('descripcion_carga')} placeholder="Ej. 10 cajas de libros" />
          </div>

          <div style={S.row}>
            <div style={S.field}>
              <span style={S.label}>Peso (kg)</span>
              <input style={S.input} type="number" value={form.peso_kg} onChange={set('peso_kg')} />
            </div>
            <div style={S.field}>
              <span style={S.label}>Volumen (m³)</span>
              <input style={S.input} type="number" value={form.volumen_m3} onChange={set('volumen_m3')} />
            </div>
            <div style={S.field}>
              <span style={S.label}>Cantidad</span>
              <input style={S.input} type="number" value={form.cantidad_unidades} onChange={set('cantidad_unidades')} />
            </div>
          </div>

          <div style={{ ...S.h3, fontSize: 14, margin: '4px 0' }}>Destino del pedido</div>
          <div style={S.row}>
            <div style={S.field}>
              <span style={S.label}>Departamento</span>
              <select style={S.input} value={form.destino_departamento} onChange={set('destino_departamento')}>
                <option value="">Selecciona…</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <span style={S.label}>Ciudad</span>
              <input style={S.input} value={form.destino_ciudad} onChange={set('destino_ciudad')} />
            </div>
            <div style={S.field}>
              <span style={S.label}>Dirección / referencia</span>
              <input style={S.input} value={form.destino_direccion} onChange={set('destino_direccion')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', color: '#F5F5F5', fontSize: 13 }}>
            <label><input type="checkbox" checked={form.requiere_refrigeracion} onChange={set('requiere_refrigeracion')} /> Refrigeración</label>
            <label><input type="checkbox" checked={form.carga_fragil} onChange={set('carga_fragil')} /> Frágil</label>
            <label><input type="checkbox" checked={form.carga_peligrosa} onChange={set('carga_peligrosa')} /> Peligrosa</label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: GOLD, fontSize: 14,
                          border: `1px solid ${GOLD}`, borderRadius: 8, padding: '10px 14px', width: 'fit-content' }}>
            <input type="checkbox" checked={form.es_prioritario} onChange={set('es_prioritario')} />
            Marcar como <b>prioritario</b> (entra a la cola de prioridad)
          </label>

          <div>
            <button type="submit" style={S.btn} disabled={enviando}>
              {enviando ? 'Creando…' : 'Crear pedido'}
            </button>
            <span style={{ color: '#8A8A8A', fontSize: 12, marginLeft: 12 }}>
              El tracking se genera automáticamente. Prioridad mayor: internacional / carga peligrosa.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
