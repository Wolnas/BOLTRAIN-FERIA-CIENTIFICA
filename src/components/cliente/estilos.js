// Estilos compartidos (paleta negro/dorado de Boltrain) para los paneles.
export const GOLD = '#D4AF37';

export const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: {
    background: '#121212', border: `1px solid ${GOLD}`, borderRadius: 14, padding: 20,
  },
  h3: { color: GOLD, margin: '0 0 14px', fontWeight: 700, letterSpacing: 0.5 },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 },
  label: { color: '#8A8A8A', fontSize: 12 },
  input: {
    background: '#0B0B0B', border: '1px solid #333', borderRadius: 8,
    color: '#F5F5F5', padding: '10px 12px', fontSize: 14, width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    background: GOLD, color: '#000', border: 'none', borderRadius: 8,
    padding: '11px 20px', fontWeight: 700, cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`,
    borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
  },
  table: { width: '100%', borderCollapse: 'collapse', color: '#F5F5F5' },
  th: {
    textAlign: 'left', color: GOLD, borderBottom: `1px solid ${GOLD}`,
    padding: '8px 10px', fontSize: 13,
  },
  td: { padding: '8px 10px', borderBottom: '1px solid #222', fontSize: 13 },
  msg: { color: GOLD, fontSize: 13, marginTop: 10 },
  empty: { color: '#8A8A8A', fontStyle: 'italic', padding: '10px' },
  codigo: {
    display: 'inline-block', background: '#0B0B0B', border: `1px dashed ${GOLD}`,
    borderRadius: 8, padding: '8px 16px', color: GOLD, fontWeight: 700,
    letterSpacing: 2, fontSize: 20, fontFamily: 'monospace',
  },
  badge: (estado) => ({
    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    color: '#000',
    background: estado === 'internacional' ? GOLD : '#C9A227',
  }),
};
