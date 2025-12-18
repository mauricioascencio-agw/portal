-- Agregar columnas para validación SAT
-- Ejecutar después de la creación inicial de tablas

USE agentsat_portal;

-- Agregar columnas para tracking de validación SAT
ALTER TABLE cfdi
ADD COLUMN IF NOT EXISTS validacion_sat_fecha DATETIME NULL COMMENT 'Fecha de última validación con SAT',
ADD COLUMN IF NOT EXISTS validacion_sat_respuesta TEXT NULL COMMENT 'Respuesta completa del SAT en formato JSON';

-- Índice para búsquedas por fecha de validación
CREATE INDEX IF NOT EXISTS idx_cfdi_validacion_fecha ON cfdi(validacion_sat_fecha);

-- Comentarios
ALTER TABLE cfdi MODIFY COLUMN estatus_validacion
    VARCHAR(50) DEFAULT 'pendiente'
    COMMENT 'Estatus: pendiente, valido, rechazado, cancelado, revision';
