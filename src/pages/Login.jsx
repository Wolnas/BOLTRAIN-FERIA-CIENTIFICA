import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas');
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
            <h2>Bienvenido</h2>
            <h2 className="accent">de vuelta.</h2>
          </div>
          <div className="auth-left__stats">
            <div className="auth-stat">
              <span className="auth-stat__num">DS 5384</span>
              <span className="auth-stat__label">Marco legal fintech Bolivia</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat__num">DS 5503</span>
              <span className="auth-stat__label">Proteccion inversion extranjera 15 anos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1>Iniciar sesion</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-fields">
              <div className="field">
                <label>Correo electronico</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div className="field">
                <label>Contrasena</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Tu contrasena"
                  required
                />
              </div>
            </div>

            <div className="auth-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar →'}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            No tienes cuenta? <Link to="/register">Registrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
