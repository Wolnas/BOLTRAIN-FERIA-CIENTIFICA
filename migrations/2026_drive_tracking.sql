-- ============================================================================
-- BOLTRAIN DRIVE  ·  Migración de tracking GPS  (INF220 - Estructuras de Datos)
-- ----------------------------------------------------------------------------
-- Se aplica sobre la base YA existente `boltrain_db`. Es 100% ADITIVA:
-- no borra ni rehace nada de lo que ya usa el frontend React / la API FastAPI.
--
-- Modelo: al chofer (transportista) se le asigna un VIAJE del día
-- (ruta + empresa). Mientras el viaje está en curso, la app BOLTRAIN DRIVE
-- envía su ubicación cada 5-10 s -> se guarda en `ubicaciones_gps`. Los pedidos
-- que van en ese viaje heredan la última posición, así el importador/exportador
-- ve dónde está su carga en todo momento.
--
-- Uso:  mysql -u root -p boltrain_db < migrations/2026_drive_tracking.sql
-- ============================================================================

-- 1) Agregar el rol de chofer al enum de usuarios (reutiliza /auth/register).
ALTER TABLE usuarios
  MODIFY tipo_usuario
    ENUM('importador','exportador','inversor','tecnico','transportista') NOT NULL;

-- 2) VIAJE: la asignación del día (chofer + ruta + empresa).
--    Es la entidad central del tracking.
CREATE TABLE IF NOT EXISTS viajes (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  chofer_id      INT NOT NULL,                       -- usuarios.id (transportista)
  ruta_id        INT NOT NULL,                       -- rutas.id (origen->destino)
  empresa        VARCHAR(150),                       -- empresa asociada al viaje
  fecha          DATE NOT NULL,                       -- día del viaje
  estado         ENUM('programado','en_curso','finalizado') NOT NULL DEFAULT 'programado',
  iniciado_en    DATETIME NULL,                       -- cuando el chofer pulsa "Iniciar"
  finalizado_en  DATETIME NULL,
  -- Última posición conocida (cache para pintar el mapa sin recorrer todo el GPS):
  ultima_lat     DECIMAL(10,7) NULL,
  ultima_lng     DECIMAL(10,7) NULL,
  ultima_pos_en  DATETIME NULL,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_viaje_chofer FOREIGN KEY (chofer_id) REFERENCES usuarios(id),
  CONSTRAINT fk_viaje_ruta   FOREIGN KEY (ruta_id)   REFERENCES rutas(id),
  INDEX idx_viaje_chofer_fecha (chofer_id, fecha)
);

-- 3) UBICACIONES_GPS: cada punto que envía la app (la "lista enlazada" de la
--    trayectoria del viaje, ordenada por capturado_en).
CREATE TABLE IF NOT EXISTS ubicaciones_gps (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  viaje_id      INT NOT NULL,                         -- a qué viaje pertenece
  lat           DECIMAL(10,7) NOT NULL,
  lng           DECIMAL(10,7) NOT NULL,
  velocidad     DECIMAL(6,2) NULL,                    -- km/h (opcional)
  capturado_en  DATETIME NOT NULL,                    -- timestamp del dispositivo
  recibido_en   DATETIME DEFAULT CURRENT_TIMESTAMP,   -- timestamp del servidor
  CONSTRAINT fk_gps_viaje FOREIGN KEY (viaje_id) REFERENCES viajes(id),
  INDEX idx_gps_viaje_tiempo (viaje_id, capturado_en)
);

-- 4) Ligar los pedidos rastreados a un viaje, para que el cliente vea su carga.
--    Un viaje puede llevar varios pedidos; cada pedido va en un viaje.
ALTER TABLE tracking_pedidos
  ADD COLUMN viaje_id INT NULL AFTER solicitud_id,
  ADD CONSTRAINT fk_tracking_viaje FOREIGN KEY (viaje_id) REFERENCES viajes(id);

-- ============================================================================
-- Consulta que usará el cliente para saber dónde está su pedido:
--   SELECT v.ultima_lat, v.ultima_lng, v.ultima_pos_en
--   FROM tracking_pedidos t
--   JOIN viajes v ON v.id = t.viaje_id
--   WHERE t.numero_rastreo = :rastreo;
-- ============================================================================
