import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import AdminPanel from '../components/admin/AdminPanel';
import ColaPedidos from '../components/admin/ColaPedidos';
import PedidosNacionales from '../components/admin/PedidosNacionales';
import CrearPedido from '../components/cliente/CrearPedido';
import MisPedidos from '../components/cliente/MisPedidos';
import PedidosInternacionales from '../components/cliente/PedidosInternacionales';
import RastreoPedido from '../components/cliente/RastreoPedido';
import './Dashboard.css';

// Tabs segun el rol. La web es a la vez portal del cliente y del admin.
const TABS_CLIENTE = ['Crear Pedido', 'Mis Pedidos', 'Rastrear Pedido', 'Pedidos Internacionales'];
const TABS_ADMIN = ['Pedidos Nacionales', 'Pedidos Internacionales', 'Cola', 'Admin'];

export default function Dashboard() {
  const { user } = useAuth();
  const esAdmin = !!user?.es_admin;
  const tabs = esAdmin ? TABS_ADMIN : TABS_CLIENTE;

  const [tab, setTab] = useState(tabs[0]);
  const [numeroRastreo, setNumeroRastreo] = useState('');
  const [pedidoAsignar, setPedidoAsignar] = useState(null);

  // Desde "Mis Pedidos" / "Crear Pedido" se salta a la pestaña de rastreo.
  const irARastrear = (numero) => {
    setNumeroRastreo(numero);
    setTab('Rastrear Pedido');
  };

  // Desde "Cola" (despachar) se salta a "Admin" con el pedido preseleccionado.
  const irAAsignar = (solicitudId) => {
    setPedidoAsignar(solicitudId);
    setTab('Admin');
  };

  return (
    <div className="page-wrapper">
      <Navbar dark={true} />
      <main className="dashboard">
        <div className="dashboard__header">
          <div>
            <h1>Bienvenido, <span>{user?.nombre}</span></h1>
            <p>{esAdmin ? 'Panel de administrador' : 'Panel del cliente'} — {user?.tipo_usuario}</p>
          </div>
        </div>

        <div className="dash-tabs">
          {tabs.map(t => (
            <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          {/* ---- Cliente ---- */}
          {tab === 'Crear Pedido' && <CrearPedido onRastrear={irARastrear} />}
          {tab === 'Mis Pedidos' && <MisPedidos onRastrear={irARastrear} />}
          {tab === 'Rastrear Pedido' && <RastreoPedido numeroInicial={numeroRastreo} />}
          {tab === 'Pedidos Internacionales' && <PedidosInternacionales />}

          {/* ---- Admin ---- */}
          {tab === 'Pedidos Nacionales' && <PedidosNacionales />}
          {tab === 'Cola' && <ColaPedidos onAsignar={irAAsignar} />}
          {tab === 'Admin' && <AdminPanel solicitudInicial={pedidoAsignar} />}
        </div>
      </main>
    </div>
  );
}
