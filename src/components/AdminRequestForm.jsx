import React, { useState } from 'react';

// Formulario de PETICIÓN de código de administrador (empresa). Por ahora es
// SOLO VISUAL: no envía nada al backend; muestra un mensaje de confirmación.
const GOLD = '#D4AF37';

export default function AdminRequestForm({ onClose }) {
  const [form, setForm] = useState({ empresa: '', nombre: '', email: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const st = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#121212', border: `1px solid ${GOLD}`, borderRadius: 14, padding: 24,
      width: 'min(460px, 92vw)' },
    h: { color: GOLD, margin: '0 0 6px' },
    p: { color: '#8A8A8A', fontSize: 13, margin: '0 0 16px' },
    input: { background: '#0B0B0B', border: '1px solid #333', borderRadius: 8, color: '#F5F5F5',
      padding: '10px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box', marginBottom: 12 },
    btn: { background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '11px 20px',
      fontWeight: 700, cursor: 'pointer', width: '100%' },
    close: { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8,
      padding: '6px 12px', cursor: 'pointer', float: 'right' },
  };

  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>
        <button style={st.close} onClick={onClose}>✕</button>
        <h3 style={st.h}>Solicitar código de administrador</h3>
        <p style={st.p}>
          ¿Tu empresa quiere gestionar su flota en Boltrain? Envíanos una solicitud y te
          contactaremos con tu código de administrador.
        </p>
        {enviado ? (
          <p style={{ color: '#2ecc71', fontSize: 15 }}>
            ✓ Solicitud enviada. Te contactaremos pronto al correo indicado.
          </p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setEnviado(true); }}>
            <input style={st.input} placeholder="Nombre de la empresa" value={form.empresa} onChange={set('empresa')} required />
            <input style={st.input} placeholder="Tu nombre" value={form.nombre} onChange={set('nombre')} required />
            <input style={st.input} type="email" placeholder="Correo de contacto" value={form.email} onChange={set('email')} required />
            <textarea style={{ ...st.input, minHeight: 70 }} placeholder="Cuéntanos sobre tu flota (opcional)" value={form.mensaje} onChange={set('mensaje')} />
            <button style={st.btn} type="submit">Enviar solicitud</button>
          </form>
        )}
      </div>
    </div>
  );
}
