import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Globe from '../components/common/Globe';
import './Landing.css';

export default function Landing() {
  return (
    <div className="page-wrapper">
      <Navbar dark={true} />
      <main>
        <section className="hero">
          <div className="hero__content">
            <div className="hero__tag">Exportación e importación · Bolivia y el mundo</div>
            <h1>BOLIVIA <span>para el mundo</span></h1>
            <p className="hero__sub">
              Gestioná y seguí tus envíos, desde el despacho hasta la entrega.
              Controlá cada paquete y operación desde tu celular.
            </p>
            <div className="hero__ctas">
              <Link to="/dashboard" className="btn btn--primary btn--lg">Mis pedidos</Link>
            </div>
            <div className="hero__stats">
              <div className="hero-stat"><span>Tiempo real</span><p>seguimiento de cada envío</p></div>
              <div className="hero-stat"><span>Nacional</span><p>y alcance internacional</p></div>
              <div className="hero-stat"><span>24/7</span><p>control desde tu celular</p></div>
              <div className="hero-stat"><span>Aduana</span><p>gestión simplificada</p></div>
            </div>
          </div>

          <div className="hero__brand">
            <Globe size={340} speed={16} />
            <div className="hero__wordmark">
              BOL<span>TRAIN</span>
              <small>International Trade</small>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
