-- ============================================================================
-- BOLTRAIN · Flujo Boltrain Drive (empresa+codigo, hora de salida, pedido)
-- ----------------------------------------------------------------------------
-- Cierra el flujo del chofer:
--   #7  Empresas con codigo unico (el admin la crea; el chofer se une con el
--       codigo o queda "libre" -> empresa_id NULL).
--   #3  hora exacta de salida programada por el admin (viajes.salida_programada).
--   #5/#6  enlace del viaje con el pedido (solicitud_id) para la pagina del
--       pedido y su ID de tracking.
--   Ejecutar:  mysql -u root -p boltrain_db < migrations/2026_flujo_drive.sql
-- ============================================================================

-- #7 Empresas con codigo -----------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  nombre    VARCHAR(150) NOT NULL,
  codigo    VARCHAR(12)  NOT NULL UNIQUE,
  admin_id  INT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES usuarios(id)
);

ALTER TABLE usuarios
  ADD COLUMN empresa_id INT NULL AFTER empresa,
  ADD CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);

-- #3 hora de salida + #5/#6 enlace al pedido ---------------------------------
ALTER TABLE viajes
  ADD COLUMN salida_programada DATETIME NULL AFTER fecha,
  ADD COLUMN solicitud_id INT NULL AFTER ruta_id,
  ADD CONSTRAINT fk_viajes_solicitud
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes_cotizacion(id);
