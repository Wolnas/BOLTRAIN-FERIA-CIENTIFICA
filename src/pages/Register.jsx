import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const USER_TYPES = [
  { value: 'importador', label: 'Importador', desc: 'Quiero importar productos a Bolivia' },
  { value: 'exportador', label: 'Exportador / Productor', desc: 'Tengo productos para exportar' },
  { value: 'inversor', label: 'Inversor', desc: 'Quiero invertir en produccion boliviana' },
  { value: 'tecnico', label: 'Tecnico de Puerto', desc: 'Gestiono contenedores y carga' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tipo_usuario: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    pais: 'Bolivia',
    empresa: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleTypeSelect = (type) => {
    setForm({ ...form, tipo_usuario: type });
  };

  const validateStep1 = () => {
    if (!form.tipo_usuario) { setError('Selecciona un tipo de cuenta'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.nombre || !form.apellido) { setError('Nombre y apellido son requeridos'); return false; }
    if (!form.email.includes('@')) { setError('Email invalido'); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (form.password.length < 8) { setError('La contrasena debe tener al menos 8 caracteres'); return false; }
    if (form.password !== form.password_confirm) { setError('Las contrasenas no coinciden'); return false; }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left__content">
          <Link to="/" className="auth-logo">BOLT<span>RAIN</span></Link>
          <div className="auth-left__tagline">
            <h2>Bolivia tiene la materia prima.</h2>
            <h2 className="accent">El mundo tiene el capital.</h2>
          </div>
          <div className="auth-left__stats">
            <div className="auth-stat">
              <span className="auth-stat__num">630%</span>
              <span className="auth-stat__label">crecimiento cripto Bolivia 2025</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat__num">3</span>
              <span className="auth-stat__label">nodos internacionales</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat__num">0%</span>
              <span className="auth-stat__label">comisiones bancarias</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-steps">
            {[1, 2, 3].map(n => (
              <div key={n} className={`auth-step ${step >= n ? 'active' : ''} ${step > n ? 'done' : ''}`}>
                <span>{step > n ? '✓' : n}</span>
              </div>
            ))}
          </div>

          <div className="auth-card__header">
            <h1>{step === 1 ? 'Tipo de cuenta' : step === 2 ? 'Tus datos' : 'Contrasena'}</h1>
            <p>{step === 1 ? 'Selecciona como usaras BOLTRAIN' : step === 2 ? 'Completa tu informacion' : 'Crea tu contrasena segura'}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>

            {/* STEP 1 — Tipo de usuario */}
            {step === 1 && (
              <div className="type-grid">
                {USER_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`type-card ${form.tipo_usuario === t.value ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(t.value)}
                  >
                    <span className="type-card__label">{t.label}</span>
                    <span className="type-card__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 2 — Datos personales */}
            {step === 2 && (
              <div className="form-fields">
                <div className="field-row">
                  <div className="field">
                    <label>Nombre</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan" required />
                  </div>
                  <div className="field">
                    <label>Apellido</label>
                    <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Perez" required />
                  </div>
                </div>
                <div className="field">
                  <label>Correo electronico</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@empresa.com" required />
                </div>
                <div className="field">
                  <label>Telefono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+591 7XXXXXXX" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Pais</label>
                    <select name="pais" value={form.pais} onChange={handleChange}>
                      <option>Bolivia</option>
                      <option>Argentina</option>
                      <option>Chile</option>
                      <option>Peru</option>
                      <option>Brasil</option>
                      <option>Estados Unidos</option>
                      <option>Espana</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Empresa (opcional)</label>
                    <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Mi Empresa S.R.L." />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Contrasena */}
            {step === 3 && (
              <div className="form-fields">
                <div className="field">
                  <label>Contrasena</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimo 8 caracteres" required />
                </div>
                <div className="field">
                  <label>Confirmar contrasena</label>
                  <input name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} placeholder="Repite tu contrasena" required />
                </div>
                <div className="terms-check">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">
                    Acepto los <a href="/terminos" target="_blank">Terminos de Uso</a> y la <a href="/privacidad" target="_blank">Politica de Privacidad</a>
                  </label>
                </div>
              </div>
            )}

            <div className="auth-actions">
              {step > 1 && (
                <button type="button" className="btn-back" onClick={() => setStep(step - 1)}>
                  ← Atras
                </button>
              )}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creando cuenta...' : step === 3 ? 'Crear cuenta' : 'Continuar →'}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
