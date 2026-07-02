import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import api from '../../services/api';

// Mapa de la ruta calculada por A* (#6) + ultima posicion GPS del chofer.
const GOLD = '#D4AF37';
const CENTER_BO = { lat: -17.5, lng: -65.5 }; // centro aproximado de Bolivia

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#121212', border: `1px solid ${GOLD}`, borderRadius: 14,
    padding: 18, width: 'min(880px, 94vw)', maxHeight: '92vh', overflow: 'auto',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: GOLD, margin: 0, fontWeight: 700 },
  close: { background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '4px 12px', cursor: 'pointer' },
  meta: { color: '#F5F5F5', fontSize: 13, marginBottom: 10, display: 'flex', gap: 18, flexWrap: 'wrap' },
  tag: { color: '#8A8A8A' },
  info: { color: '#8A8A8A', fontStyle: 'italic', padding: 20, textAlign: 'center' },
};

const mapStyle = { width: '100%', height: '460px', borderRadius: 10 };

export default function RutaMapa({ viajeId, onClose }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
  });
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let vivo = true;
    const cargar = () => api.get(`/viajes/${viajeId}/tracking`)
      .then(r => { if (vivo) setData(r.data); })
      .catch(() => { if (vivo) setErr('No se pudo cargar el tracking del viaje.'); });
    cargar();
    // Tiempo real: refresca la posición del chofer cada 4s.
    const t = setInterval(cargar, 4000);
    return () => { vivo = false; clearInterval(t); };
  }, [viajeId]);

  const waypoints = (data?.astar?.waypoints || []).map(w => ({ lat: w.lat, lng: w.lng }));
  const gps = (data?.gps || []).map(p => ({ lat: p.lat, lng: p.lng }));
  const ultima = data?.ultima ? { lat: data.ultima.lat, lng: data.ultima.lng } : null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.head}>
          <h3 style={S.title}>Ubicación del chofer en vivo · viaje #{viajeId}</h3>
          <button style={S.close} onClick={onClose}>Cerrar</button>
        </div>

        <div style={S.meta}>
          <span><span style={S.tag}>ID de tracking:</span> {data?.numero_rastreo || '—'}</span>
          <span><span style={S.tag}>Estado:</span> {data?.estado || '—'}</span>
          <span><span style={S.tag}>Distancia A*:</span> {data?.astar?.distancia_km ? `${data.astar.distancia_km} km` : '—'}</span>
        </div>

        {loadError && <p style={S.info}>Error cargando Google Maps. Revisa REACT_APP_GOOGLE_MAPS_KEY.</p>}
        {err && <p style={S.info}>{err}</p>}
        {!loadError && !err && !isLoaded && <p style={S.info}>Cargando mapa…</p>}

        {!loadError && !err && isLoaded && (
          data && !data.astar?.resuelto ? (
            <p style={S.info}>
              Esta ruta no es nacional (no se pudo calcular A* sobre ciudades de Bolivia).
            </p>
          ) : (
            <GoogleMap
              mapContainerStyle={mapStyle}
              center={ultima || waypoints[0] || CENTER_BO}
              zoom={6}
              options={{ streetViewControl: false, mapTypeControl: false }}
            >
              {waypoints.length > 1 && (
                <Polyline
                  path={waypoints}
                  options={{ strokeColor: GOLD, strokeOpacity: 0.9, strokeWeight: 4 }}
                />
              )}
              {waypoints[0] && <Marker position={waypoints[0]} label="A" />}
              {waypoints.length > 1 && <Marker position={waypoints[waypoints.length - 1]} label="B" />}
              {gps.length > 1 && (
                <Polyline
                  path={gps}
                  options={{ strokeColor: '#4FC3F7', strokeOpacity: 0.9, strokeWeight: 3 }}
                />
              )}
              {ultima && (
                <Marker
                  position={ultima}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7, fillColor: '#4FC3F7', fillOpacity: 1,
                    strokeColor: '#fff', strokeWeight: 2,
                  }}
                  title="Ultima posicion del chofer"
                />
              )}
            </GoogleMap>
          )
        )}
      </div>
    </div>
  );
}
