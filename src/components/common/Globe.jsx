import React from 'react';
import './Globe.css';

/**
 * Logo globo BOLTRAIN animado (video real del logo).
 * Se reproduce en bucle, sin sonido, recortado en círculo.
 */
export default function Globe({ size = 320, src = '/globe.mp4' }) {
  return (
    <div
      className="globe"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="globe__glow" />
      <video
        className="globe__video"
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
