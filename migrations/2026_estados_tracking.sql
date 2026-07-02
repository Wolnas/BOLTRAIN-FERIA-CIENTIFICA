-- ============================================================================
-- BOLTRAIN · Estados de almacen/despacho en el tracking
-- ----------------------------------------------------------------------------
-- Agrega 'en_almacen' y 'despachado' al flujo de estados del paquete:
--   pendiente -> en_almacen -> despachado -> en_transito -> en_destino -> entregado
--   Ejecutar:  mysql -u root -p boltrain_db < migrations/2026_estados_tracking.sql
-- ============================================================================
ALTER TABLE tracking_pedidos
  MODIFY COLUMN estado
  ENUM('pendiente','en_revision','cotizado','confirmado','en_almacen',
       'despachado','en_transito','en_aduana','en_destino','entregado')
  DEFAULT 'pendiente';
