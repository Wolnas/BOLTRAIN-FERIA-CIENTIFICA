import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import './Dashboard.css';

const TABS = ['Inicio', 'Wallet', 'Contenedores', 'Pedidos', 'Inversiones'];

// ⚠️ RECOMENDACIÓN: Mueve estas llaves a un archivo .env (ej: import.meta.env.VITE_MAPS_KEY)
const MAPS_KEY = 'borrado';
// Asegúrate de que esta clave empiece con "AIzaSy..." generada desde Google AI Studio
const GEMINI_KEY = 'borrado'; 

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Inicio');
  const [usdtPrice, setUsdtPrice] = useState(null); 
  const [wallet, setWallet] = useState('');
  const [editingWallet, setEditingWallet] = useState(false);
  const [tempWallet, setTempWallet] = useState('');
  const [step, setStep] = useState(1);
  const [categorias, setCategorias] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [form, setForm] = useState({
    categoria_id: null, tipo_ruta: 'predeterminada', ruta_id: null,
    origen_personalizado: '', destino_personalizado: '',
    peso_kg: '', volumen_m3: '', cantidad_unidades: '',
    descripcion_carga: '', requiere_refrigeracion: false,
    carga_fragil: false, carga_peligrosa: false,
  });
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [direccion, setDireccion] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [formDir, setFormDir] = useState({
    departamento: '', ciudad: '', zona: '', calle: '', numero: '', referencia: ''
  });
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [codigoPostal, setCodigoPostal] = useState('');
  const [rutaModal, setRutaModal] = useState(null);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=bob')
      .then(res => res.json())
      .then(data => setUsdtPrice(data?.tether?.bob || 10))
      .catch(() => setUsdtPrice(10));
  }, []);

  useEffect(() => {
    if (tab === 'Contenedores') {
      api.get('/contenedor/categorias').then(r => setCategorias(r.data)).catch(() => {});
      api.get('/contenedor/rutas').then(r => setRutas(r.data)).catch(() => {});
      api.get('/contenedor/mis-solicitudes').then(r => setMisSolicitudes(r.data)).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'Pedidos') {
      api.get('/pedidos/direccion')
        .then(r => { setDireccion(r.data); setCodigoPostal(r.data.codigo_postal); })
        .catch(() => setDireccion(null));
      api.get('/pedidos/mis-pedidos')
        .then(r => setPedidos(r.data))
        .catch(() => {});
    }
  }, [tab]);

  const saveWallet = () => {
    if (tempWallet) setWallet(tempWallet);
    setEditingWallet(false);
  };

  const enviarSolicitud = async () => {
    setEnviando(true);
    try {
      await api.post('/contenedor/solicitud', {
        ...form,
        peso_kg: parseFloat(form.peso_kg) || null,
        volumen_m3: parseFloat(form.volumen_m3) || null,
        cantidad_unidades: parseInt(form.cantidad_unidades) || null,
      });
      setExito(true);
      setStep(1);
      setForm({
        categoria_id: null, tipo_ruta: 'predeterminada', ruta_id: null,
        origen_personalizado: '', destino_personalizado: '',
        peso_kg: '', volumen_m3: '', cantidad_unidades: '',
        descripcion_carga: '', requiere_refrigeracion: false,
        carga_fragil: false, carga_peligrosa: false,
      });
      api.get('/contenedor/mis-solicitudes').then(r => setMisSolicitudes(r.data));
    } catch (e) {
      alert('Error al enviar solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const guardarDireccion = async () => {
    if (!formDir.departamento || !formDir.ciudad) {
      alert('Departamento y ciudad son requeridos');
      return;
    }
    setGuardandoDir(true);
    try {
      const res = await api.post('/pedidos/direccion', formDir);
      setCodigoPostal(res.data.codigo_postal);
      setDireccion(res.data.direccion);
      api.get('/pedidos/mis-pedidos').then(r => setPedidos(r.data));
    } catch (e) {
      alert('Error al guardar direccion');
    } finally {
      setGuardandoDir(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar dark={false} />
      <main className="dashboard">

        <div className="dashboard__header">
          <div>
            <h1>Bienvenido, <span>{user?.nombre}</span></h1>
            <p>Panel de control — {user?.tipo_usuario}</p>
          </div>
        </div>

        <div className="dash-tabs">
          {TABS.map(t => (
            <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Inicio' && (
          <div className="dashboard__grid">
            <div className="dash-card dash-card--gold">
              <span className="dash-card__icon">💱</span>
              <h3>USDT / BOB</h3>
              <div className="dash-card__value">Bs. {usdtPrice || '...'}</div>
              <p>Precio paralelo en tiempo real</p>
            </div>
            <div className="dash-card" onClick={() => setTab('Wallet')} style={{cursor:'pointer'}}>
              <span className="dash-card__icon">👛</span>
              <h3>Mi Wallet</h3>
              <div className="dash-card__empty">{wallet ? wallet.slice(0,16)+'...' : 'Sin wallet configurada'}</div>
              <p>Clic para gestionar</p>
            </div>
            <div className="dash-card" onClick={() => setTab('Contenedores')} style={{cursor:'pointer'}}>
              <span className="dash-card__icon">📦</span>
              <h3>Contenedores</h3>
              <div className="dash-card__empty">0 disponibles</div>
              <p>Ver contenedores</p>
            </div>
            <div className="dash-card" onClick={() => setTab('Pedidos')} style={{cursor:'pointer'}}>
              <span className="dash-card__icon">🚚</span>
              <h3>Mis Pedidos</h3>
              <div className="dash-card__empty">{pedidos.length} activos</div>
              <p>Ver tracking</p>
            </div>
          </div>
        )}

        {tab === 'Wallet' && (
          <div className="wallet-panel">
            <div className="wallet-card">
              <div className="wallet-card__header">
                <span>👛</span>
                <h2>Mi Wallet USDT</h2>
              </div>
              <div className="wallet-balance">
                <p className="wallet-balance__label">Saldo estimado</p>
                <p className="wallet-balance__amount">0.00 <span>USDT</span></p>
                <p className="wallet-balance__bob">≈ Bs. 0.00</p>
              </div>
              {wallet && !editingWallet ? (
                <div className="wallet-address">
                  <p className="wallet-address__label">Direccion TRC-20</p>
                  <div className="wallet-address__box">
                    <span>{wallet}</span>
                    <button onClick={() => navigator.clipboard.writeText(wallet)}>Copiar</button>
                  </div>
                  <button className="wallet-btn-edit" onClick={() => { setTempWallet(wallet); setEditingWallet(true); }}>
                    Cambiar direccion
                  </button>
                </div>
              ) : (
                <div className="wallet-address">
                  <p className="wallet-address__label">Ingresa tu direccion USDT (TRC-20)</p>
                  <input className="wallet-input" placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={tempWallet} onChange={e => setTempWallet(e.target.value)} />
                  <button className="wallet-btn-save" onClick={saveWallet}>Guardar wallet</button>
                </div>
              )}
              <div className="wallet-actions">
                <button className="wallet-btn wallet-btn--primary">Comprar USDT</button>
                <button className="wallet-btn wallet-btn--outline">Enviar</button>
                <button className="wallet-btn wallet-btn--outline">Recibir</button>
                <button className="wallet-btn wallet-btn--outline">Historial</button>
              </div>
              <div className="wallet-rate">
                <span>Tasa actual:</span>
                <strong>1 USDT = Bs. {usdtPrice || '...'}</strong>
              </div>
            </div>
          </div>
        )}

        {tab === 'Contenedores' && (
          <div className="contenedor-panel">
            {exito && (
              <div className="alert-success">
                ✅ Solicitud enviada — un tecnico revisara tu cotizacion pronto.
                <button onClick={() => setExito(false)}>✕</button>
              </div>
            )}
            <div className="contenedor-steps">
              {['Categoria', 'Ruta', 'Carga', 'Confirmar'].map((s, i) => (
                <div key={s} className={`cstep ${step === i+1 ? 'active' : step > i+1 ? 'done' : ''}`}>
                  <span>{step > i+1 ? '✓' : i+1}</span>
                  <p>{s}</p>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="cstep-content">
                <h3>Selecciona el tipo de carga</h3>
                <p className="cstep-sub">¿Que tipo de mercancia deseas importar o exportar?</p>
                <div className="categoria-grid">
                  {categorias.map(c => (
                    <button key={c.id}
                      className={`categoria-card ${form.categoria_id === c.id ? 'selected' : ''}`}
                      onClick={() => setForm({...form, categoria_id: c.id})}>
                      <span className="categoria-icon">{c.icono}</span>
                      <span className="categoria-nombre">{c.nombre}</span>
                      <span className="categoria-desc">{c.descripcion}</span>
                    </button>
                  ))}
                </div>
                <div className="cstep-actions">
                  <button className="btn-next-step" disabled={!form.categoria_id} onClick={() => setStep(2)}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="cstep-content">
                <h3>Selecciona la ruta</h3>
                <p className="cstep-sub">Elige una ruta predeterminada o crea una personalizada</p>
                <div className="ruta-toggle">
                  <button className={form.tipo_ruta === 'predeterminada' ? 'active' : ''}
                    onClick={() => setForm({...form, tipo_ruta: 'predeterminada'})}>
                    Rutas predeterminadas
                  </button>
                  <button className={form.tipo_ruta === 'personalizada' ? 'active' : ''}
                    onClick={() => setForm({...form, tipo_ruta: 'personalizada'})}>
                    Ruta personalizada
                  </button>
                </div>
                {form.tipo_ruta === 'predeterminada' && (
                  <div className="rutas-grid">
                    {rutas.filter(r => r.es_predeterminada).map(r => (
                      <button key={r.id}
                        className={`ruta-card ${form.ruta_id === r.id ? 'selected' : ''}`}
                        onClick={() => setForm({...form, ruta_id: r.id})}>
                        <div className="ruta-card__origen">{r.origen_pais}</div>
                        <div className="ruta-card__arrow">→</div>
                        <div className="ruta-card__destino">{r.destino_pais}</div>
                        <div className="ruta-card__tiempo">⏱ {r.tiempo_estimado}</div>
                      </button>
                    ))}
                  </div>
                )}
                {form.tipo_ruta === 'personalizada' && (
                  <div className="ruta-custom">
                    <div className="field">
                      <label>Origen (pais / ciudad)</label>
                      <input placeholder="Ej: Japon, Tokyo" value={form.origen_personalizado}
                        onChange={e => setForm({...form, origen_personalizado: e.target.value})} />
                    </div>
                    <div className="field">
                      <label>Destino (pais / ciudad)</label>
                      <input placeholder="Ej: Bolivia, Santa Cruz" value={form.destino_personalizado}
                        onChange={e => setForm({...form, destino_personalizado: e.target.value})} />
                    </div>
                  </div>
                )}
                <div className="cstep-actions">
                  <button className="btn-back-step" onClick={() => setStep(1)}>← Atras</button>
                  <button className="btn-next-step"
                    disabled={form.tipo_ruta === 'predeterminada' ? !form.ruta_id : !form.origen_personalizado}
                    onClick={() => setStep(3)}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="cstep-content">
                <h3>Detalles de la carga</h3>
                <p className="cstep-sub">Ingresa las caracteristicas de tu mercancia</p>
                <div className="carga-grid">
                  <div className="field">
                    <label>Peso total (kg)</label>
                    <input type="number" placeholder="Ej: 500" value={form.peso_kg}
                      onChange={e => setForm({...form, peso_kg: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Volumen (m3)</label>
                    <input type="number" placeholder="Ej: 2.5" value={form.volumen_m3}
                      onChange={e => setForm({...form, volumen_m3: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Cantidad de unidades</label>
                    <input type="number" placeholder="Ej: 100" value={form.cantidad_unidades}
                      onChange={e => setForm({...form, cantidad_unidades: e.target.value})} />
                  </div>
                </div>
                <div className="field" style={{marginTop:'1rem'}}>
                  <label>Descripcion de la carga</label>
                  <textarea placeholder="Describe tu mercancia..." rows={3}
                    value={form.descripcion_carga}
                    onChange={e => setForm({...form, descripcion_carga: e.target.value})} />
                </div>
                <div className="carga-checks">
                  <label className="check-item">
                    <input type="checkbox" checked={form.requiere_refrigeracion}
                      onChange={e => setForm({...form, requiere_refrigeracion: e.target.checked})} />
                    🧊 Requiere refrigeracion
                  </label>
                  <label className="check-item">
                    <input type="checkbox" checked={form.carga_fragil}
                      onChange={e => setForm({...form, carga_fragil: e.target.checked})} />
                    ⚠️ Carga fragil
                  </label>
                  <label className="check-item">
                    <input type="checkbox" checked={form.carga_peligrosa}
                      onChange={e => setForm({...form, carga_peligrosa: e.target.checked})} />
                    ☣️ Carga peligrosa
                  </label>
                </div>
                <div className="cstep-actions">
                  <button className="btn-back-step" onClick={() => setStep(2)}>← Atras</button>
                  <button className="btn-next-step" onClick={() => setStep(4)}>Continuar →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="cstep-content">
                <h3>Confirma tu solicitud</h3>
                <p className="cstep-sub">Revisa los datos antes de enviar</p>
                <div className="resumen-box">
                  <div className="resumen-row">
                    <span>Categoria</span>
                    <strong>{categorias.find(c => c.id === form.categoria_id)?.nombre}</strong>
                  </div>
                  <div className="resumen-row">
                    <span>Ruta</span>
                    <strong>
                      {form.tipo_ruta === 'predeterminada'
                        ? (() => { const r = rutas.find(r => r.id === form.ruta_id); return r ? `${r.origen_pais} → ${r.destino_pais}` : ''; })()
                        : `${form.origen_personalizado} → ${form.destino_personalizado}`}
                    </strong>
                  </div>
                  {form.peso_kg && <div className="resumen-row"><span>Peso</span><strong>{form.peso_kg} kg</strong></div>}
                  {form.volumen_m3 && <div className="resumen-row"><span>Volumen</span><strong>{form.volumen_m3} m3</strong></div>}
                  {form.cantidad_unidades && <div className="resumen-row"><span>Unidades</span><strong>{form.cantidad_unidades}</strong></div>}
                  {form.descripcion_carga && <div className="resumen-row"><span>Descripcion</span><strong>{form.descripcion_carga}</strong></div>}
                  <div className="resumen-row">
                    <span>Estado</span>
                    <strong className="badge-pendiente">Pendiente de cotizacion</strong>
                  </div>
                </div>
                <div className="cstep-actions">
                  <button className="btn-back-step" onClick={() => setStep(3)}>← Atras</button>
                  <button className="btn-next-step" disabled={enviando} onClick={enviarSolicitud}>
                    {enviando ? 'Enviando...' : '✅ Enviar solicitud'}
                  </button>
                </div>
              </div>
            )}

            {misSolicitudes.length > 0 && (
              <div className="mis-solicitudes">
                <h3>Mis solicitudes</h3>
                <div className="solicitudes-list">
                  {misSolicitudes.map(s => (
                    <div key={s.id} className="solicitud-item">
                      <div className="solicitud-item__id">#{s.id}</div>
                      <div className="solicitud-item__info">
                        <span>{s.descripcion_carga || 'Sin descripcion'}</span>
                        <span className={`badge-estado badge-${s.estado}`}>{s.estado}</span>
                      </div>
                      {s.precio_estimado && <div className="solicitud-item__precio">${s.precio_estimado} USD</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'Pedidos' && (
          <div className="pedidos-panel">
            {!direccion && (
              <div className="direccion-card">
                <div className="direccion-card__header">
                  <span>📍</span>
                  <div>
                    <h3>Registra tu direccion</h3>
                    <p>Necesitas una direccion para recibir tu codigo postal y rastrear tus pedidos</p>
                  </div>
                </div>
                <div className="dir-grid">
                  <div className="field">
                    <label>Departamento</label>
                    <select value={formDir.departamento}
                      onChange={e => setFormDir({...formDir, departamento: e.target.value})}>
                      <option value="">Selecciona...</option>
                      {['La Paz','Cochabamba','Santa Cruz','Oruro','Potosi','Chuquisaca','Tarija','Beni','Pando'].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Ciudad</label>
                    <input placeholder="Ej: Santa Cruz de la Sierra"
                      value={formDir.ciudad}
                      onChange={e => setFormDir({...formDir, ciudad: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Zona / Barrio</label>
                    <input placeholder="Ej: Plan 3000"
                      value={formDir.zona}
                      onChange={e => setFormDir({...formDir, zona: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Calle</label>
                    <input placeholder="Ej: Av. Banzer"
                      value={formDir.calle}
                      onChange={e => setFormDir({...formDir, calle: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Numero</label>
                    <input placeholder="Ej: 123"
                      value={formDir.numero}
                      onChange={e => setFormDir({...formDir, numero: e.target.value})} />
                  </div>
                </div>
                <div className="field" style={{marginTop:'0.75rem'}}>
                  <label>Referencia</label>
                  <input placeholder="Ej: Frente al mercado los pozos"
                    value={formDir.referencia}
                    onChange={e => setFormDir({...formDir, referencia: e.target.value})} />
                </div>
                <button className="btn-guardar-dir" disabled={guardandoDir} onClick={guardarDireccion}>
                  {guardandoDir ? 'Guardando...' : '📍 Guardar direccion y obtener codigo postal'}
                </button>
              </div>
            )}

            {direccion && (
              <>
                <div className="postal-banner">
                  <div className="postal-banner__left">
                    <span>📮</span>
                    <div>
                      <p className="postal-label">Tu codigo postal BOLTRAIN</p>
                      <p className="postal-code">{codigoPostal}</p>
                    </div>
                  </div>
                  <div className="postal-banner__right">
                    <p>{direccion.ciudad}, {direccion.departamento}</p>
                    <p>{direccion.calle} {direccion.numero} {direccion.zona ? `— ${direccion.zona}` : ''}</p>
                  </div>
                </div>

                <h3 className="pedidos-titulo">Mis pedidos</h3>

                {pedidos.length === 0 ? (
                  <div className="dash-empty-state">
                    <span>📦</span>
                    <h3>Sin pedidos aun</h3>
                    <p>Crea una solicitud en Contenedores para empezar</p>
                  </div>
                ) : (
                  <div className="pedidos-list">
                    {pedidos.map(p => (
                      <div key={p.solicitud_id} className="pedido-card">
                        <div className="pedido-card__top">
                          <div>
                            <p className="pedido-desc">{p.descripcion}</p>
                            {p.numero_rastreo && (
                              <p className="pedido-rastreo">🔍 {p.numero_rastreo}</p>
                            )}
                          </div>
                          <span className={`badge-estado badge-${p.estado}`}>{p.estado.replace('_',' ')}</span>
                        </div>
                        <div className="tracking-bar">
                          {['pendiente','en_revision','cotizado','confirmado','en_transito','en_aduana','en_destino','entregado'].map((e, i, arr) => {
                            const idx = arr.indexOf(p.estado);
                            const done = i <= idx;
                            return (
                              <div key={e} className={`tracking-step ${done ? 'done' : ''} ${p.estado === e ? 'current' : ''}`}>
                                <div className="tracking-dot"></div>
                                <p>{e.replace(/_/g,' ')}</p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="pedido-fecha">Creado: {new Date(p.creado_en).toLocaleDateString('es-BO')}</p>
                        <div className="pedido-rutas">
                          <button className="btn-ruta btn-ruta--internacional"
                            onClick={() => setRutaModal({pedido: p, tipo: 'internacional'})}>
                            🌍 Ruta Internacional
                          </button>
                          <button className="btn-ruta btn-ruta--local"
                            onClick={() => setRutaModal({pedido: p, tipo: 'local'})}>
                            📍 Ruta Santa Cruz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'Inversiones' && (
          <div className="dash-empty-state">
            <span>📈</span>
            <h3>Oportunidades de inversion</h3>
            <p>Proximamente — activos tokenizados bolivianos disponibles para invertir en USDT</p>
          </div>
        )}

        {rutaModal && (
          <RutaModal
            rutaModal={rutaModal}
            setRutaModal={setRutaModal}
            direccion={direccion}
          />
        )}

      </main>
    </div>
  );
}
function RutaModal({ rutaModal, setRutaModal, direccion }) {
  const [geminiText, setGeminiText] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [geminiSolicitado, setGeminiSolicitado] = useState(false);
  const [tabRuta, setTabRuta] = useState(rutaModal.tipo);
  const [distancia, setDistancia] = useState(null);
  const [duracion, setDuracion] = useState(null);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const directionsRenderer = React.useRef(null);

  const configs = {
    internacional: {
      origen: 'Puerto Iquique, Chile',
      destino: 'Santa Cruz de la Sierra, Bolivia',
    },
    local: {
      origen: 'Aduana Santa Cruz de la Sierra, Bolivia',
      destino: `${direccion?.zona || ''} ${direccion?.calle || ''} ${direccion?.numero || ''}, Santa Cruz de la Sierra, Bolivia`,
    },
  };

  const conf = configs[tabRuta];

  // Cargar el script de Google Maps una sola vez
  useEffect(() => {
    if (window.google && window.google.maps) {
      initMap();
      return;
    }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', initMap);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.body.appendChild(script);
  }, []);

  // Recalcular ruta al cambiar de pestaña
  useEffect(() => {
    if (window.google && window.google.maps && mapInstance.current) {
      calcularRuta();
    }
  }, [tabRuta]);

  const initMap = () => {
    if (!mapRef.current) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -18.0, lng: -64.0 },
      zoom: 6,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
    });
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: mapInstance.current,
      polylineOptions: { strokeColor: '#EF9F27', strokeWeight: 5 },
      markerOptions: { },
    });
    calcularRuta();
  };

  const calcularRuta = () => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: conf.origen,
        destination: conf.destino,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          const dist = leg.distance.text;
          const dur = leg.duration.text;
          setDistancia(dist);
          setDuracion(dur);
          consultarGemini(dist, dur);
        } else {
          setDistancia(null);
          setDuracion(null);
          consultarGemini(null, null);
        }
      }
    );
  };

  const consultarGemini = (dist, dur) => {
    setCargando(true);
    setGeminiText(null);

    const datosRuta = dist && dur
      ? `La ruta calculada por Google Maps tiene una distancia de ${dist} y un tiempo estimado de ${dur}.`
      : '';

    const prompt = tabRuta === 'internacional'
      ? `Eres un experto en logistica internacional para Bolivia. Pedido: "${rutaModal.pedido.descripcion}". Ruta: ${conf.origen} hasta ${conf.destino}. ${datosRuta} Da recomendaciones de optimizacion para el cliente: mejor medio de transporte, costo aproximado en USD, documentos aduaneros necesarios y un consejo para reducir tiempos. Responde en español, claro y directo, maximo 4 oraciones.`
      : `Eres un experto en logistica urbana en Santa Cruz de la Sierra, Bolivia. Pedido: "${rutaModal.pedido.descripcion}". Ruta de entrega: ${conf.origen} hasta ${conf.destino}. ${datosRuta} Da recomendaciones de optimizacion para el cliente: mejor horario para entregar evitando trafico, tipo de vehiculo recomendado, costo aproximado del envio local en bolivianos y un consejo. Responde en español, claro y directo, maximo 4 oraciones.`;

    const timer = setTimeout(() => {
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            setGeminiText(data.error.code === 429
              ? 'Limite de consultas alcanzado. Espera 1 minuto e intenta de nuevo.'
              : 'No se pudo obtener sugerencia.');
          } else {
            setGeminiText(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener sugerencia.');
          }
        })
        .catch(() => setGeminiText('Error al consultar la IA.'))
        .finally(() => setCargando(false));
    }, 600);

    return () => clearTimeout(timer);
  };

  return (
    <div className="modal-overlay" onClick={() => setRutaModal(null)}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🗺 Rutas del Pedido — {rutaModal.pedido.descripcion}</h3>
          <button onClick={() => setRutaModal(null)}>✕</button>
        </div>
        <div className="modal-body">

          <div className="ruta-tabs">
            <button
              className={`ruta-tab ${tabRuta === 'internacional' ? 'active' : ''}`}
              onClick={() => setTabRuta('internacional')}>
              🌍 Ruta Internacional
            </button>
            <button
              className={`ruta-tab ${tabRuta === 'local' ? 'active' : ''}`}
              onClick={() => setTabRuta('local')}>
              📍 Ruta Santa Cruz
            </button>
          </div>

          <div className="ruta-origen-destino">
            <span className="ruta-origen">{conf.origen}</span>
            <span className="ruta-flecha">→</span>
            <span className="ruta-destino">{conf.destino}</span>
          </div>

          <div ref={mapRef} className="mapa-interactivo"></div>

          {(distancia && duracion) && (
            <div className="ruta-stats">
              <div className="ruta-stat">
                <span className="ruta-stat__icon">📏</span>
                <div>
                  <p className="ruta-stat__label">Distancia</p>
                  <p className="ruta-stat__value">{distancia}</p>
                </div>
              </div>
              <div className="ruta-stat">
                <span className="ruta-stat__icon">⏱</span>
                <div>
                  <p className="ruta-stat__label">Tiempo estimado</p>
                  <p className="ruta-stat__value">{duracion}</p>
                </div>
              </div>
            </div>
          )}

          <div className="gemini-result">
            <div className="gemini-header">
              <span>🤖</span>
              <p className="gemini-label">Optimizacion de Ruta — IA Gemini</p>
            </div>
            {cargando ? (
              <div className="gemini-loading">
                <div className="gemini-dots"><span></span><span></span><span></span></div>
                <p>Analizando la mejor ruta...</p>
              </div>
            ) : (
              <p className="gemini-text">{geminiText}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}