-- ============================================================================
-- BOLTRAIN · Rol de administrador
-- ----------------------------------------------------------------------------
-- Agrega un indicador `es_admin` a usuarios. Es transversal: un admin puede ser
-- de cualquier tipo_usuario (normalmente un 'tecnico'). El admin es quien asigna
-- viajes a los choferes desde el dashboard.
--   mysql -u root -p boltrain_db < migrations/2026_admin_flag.sql
-- ============================================================================
ALTER TABLE usuarios
  ADD COLUMN es_admin BOOLEAN NOT NULL DEFAULT FALSE AFTER activo;
