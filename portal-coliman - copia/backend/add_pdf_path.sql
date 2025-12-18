-- Agregar columna pdf_path a la tabla cfdi
ALTER TABLE cfdi ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(500) NULL AFTER xml_path;
