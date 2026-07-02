-- ============================================================================
-- BOLTRAIN · Rediseno a proyecto de Estructura de Datos 1
-- ----------------------------------------------------------------------------
-- - Simplifica los roles a 'cliente' / 'transportista'.
-- - Agrega ambito (nacional/internacional) y prioridad a los pedidos.
-- - Crea tracking_eventos: cada nodo del recorrido del paquete (lista enlazada).
--   Ejecutar:  mysql -u root -p boltrain_db < migrations/2026_roles_ds.sql
-- ============================================================================

-- Roles: todo lo que no es transportista pasa a cliente (los admin conservan es_admin).
-- 1) Ampliar el enum para admitir 'cliente' junto a los antiguos.
ALTER TABLE usuarios
  MODIFY COLUMN tipo_usuario
  ENUM('importador','exportador','inversor','tecnico','transportista','cliente') NOT NULL;
-- 2) Migrar las filas existentes.
UPDATE usuarios SET tipo_usuario = 'cliente' WHERE tipo_usuario <> 'transportista';
-- 3) Reducir el enum al conjunto final.
ALTER TABLE usuarios
  MODIFY COLUMN tipo_usuario ENUM('cliente','transportista') NOT NULL;

-- Ambito y prioridad del pedido (split nacional/intl + cola de prioridad).
ALTER TABLE solicitudes_cotizacion
  ADD COLUMN ambito ENUM('nacional','internacional') DEFAULT 'nacional' AFTER estado,
  ADD COLUMN prioridad INT DEFAULT 0 AFTER ambito;

-- Recorrido del paquete: nodos de la lista enlazada persistidos.
CREATE TABLE IF NOT EXISTS tracking_eventos (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  tracking_id INT NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  orden       INT NOT NULL,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tracking_id) REFERENCES tracking_pedidos(id)
);
