import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar({ dark = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${dark ? 'navbar--dark' : 'navbar--light'}`}>
      <Link to="/" className="navbar__logo">
        BOLT<span>RAIN</span>
      </Link>
      <ul className="navbar__links">
        <li><Link to="/#how">Cómo funciona</Link></li>
        <li><Link to="/#nodes">Nodos</Link></li>
        <li><Link to="/#invest">Inversores</Link></li>
      </ul>
      <div className="navbar__actions">
        {user ? (
          <>
            <span className="navbar__user">Hola, {user.nombre}</span>
            <button className="btn btn--outline" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="btn btn--ghost" onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--ghost">Ingresar</Link>
            <Link to="/register" className="btn btn--primary">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}
