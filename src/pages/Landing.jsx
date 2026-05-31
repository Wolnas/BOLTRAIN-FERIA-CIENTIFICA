import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './Landing.css';

export default function Landing() {
  return (
    <div className="page-wrapper">
      <Navbar dark={true} />
      <main>
        <section className="hero">
          <div className="hero__tag">Comercio internacional descentralizado · Bolivia</div>
          <h1>El mercado global al alcance del <span>productor boliviano</span></h1>
          <p className="hero__sub">
            Conectamos capital internacional con la materia prima boliviana,
            sin bancos intermediarios, usando blockchain y nodos globales.
          </p>
          <div className="hero__ctas">
            <Link to="/register" className="btn btn--primary btn--lg">Registrarme ahora</Link>
            <Link to="/register?type=inversor" className="btn btn--outline btn--lg">Soy inversor</Link>
          </div>
          <div className="hero__stats">
            <div className="hero-stat"><span>0%</span><p>comisiones bancarias</p></div>
            <div className="hero-stat"><span>3</span><p>nodos internacionales</p></div>
            <div className="hero-stat"><span>USDT</span><p>moneda de operacion</p></div>
            <div className="hero-stat"><span>100%</span><p>transparencia on-chain</p></div>
          </div>
        </section>
      </main>
    </div>
  );
}
