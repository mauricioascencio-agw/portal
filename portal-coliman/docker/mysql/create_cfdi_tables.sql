-- =====================================================
-- Script para crear tablas de CFDI
-- Ejecutar en MySQL: mysql -u agentsat_user -p agentsat_portal < create_cfdi_tables.sql
-- =====================================================

USE agentsat_portal;

-- =====================================================
-- TABLA: clients (si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    plan_type ENUM('basico', 'profesional', 'empresarial', 'corporativo') DEFAULT 'basico',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cfdi
-- =====================================================
CREATE TABLE IF NOT EXISTS cfdi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) NOT NULL,
    uuid VARCHAR(36) NOT NULL,
    tipo_comprobante ENUM('I', 'E', 'T', 'N', 'P') NOT NULL,
    serie VARCHAR(25),
    folio VARCHAR(40),
    fecha DATETIME NOT NULL,
    emisor_rfc VARCHAR(13) NOT NULL,
    emisor_nombre VARCHAR(255),
    emisor_regimen VARCHAR(3),
    receptor_rfc VARCHAR(13) NOT NULL,
    receptor_nombre VARCHAR(255),
    receptor_uso_cfdi VARCHAR(3),
    subtotal DECIMAL(15,2) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    tipo_cambio DECIMAL(10,4) DEFAULT 1,
    total_impuestos_trasladados DECIMAL(15,2),
    total_impuestos_retenidos DECIMAL(15,2),
    metodo_pago VARCHAR(3),
    forma_pago VARCHAR(3),
    condiciones_pago VARCHAR(255),
    orden_compra_id INT,
    xml_path VARCHAR(500),
    pdf_path VARCHAR(500),
    estatus_validacion ENUM('pendiente', 'valido', 'rechazado', 'revision') DEFAULT 'pendiente',
    fecha_validacion TIMESTAMP NULL,
    validacion_sat_fecha DATETIME NULL,
    validacion_sat_respuesta TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_uuid_per_client (client_id, uuid),
    INDEX idx_uuid (uuid),
    INDEX idx_emisor_rfc (emisor_rfc),
    INDEX idx_receptor_rfc (receptor_rfc),
    INDEX idx_fecha (fecha),
    INDEX idx_estatus (estatus_validacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cfdi_conceptos
-- =====================================================
CREATE TABLE IF NOT EXISTS cfdi_conceptos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cfdi_id INT NOT NULL,
    clave_prod_serv VARCHAR(8) NOT NULL,
    clave_unidad VARCHAR(3),
    cantidad DECIMAL(15,6) NOT NULL,
    descripcion TEXT NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    importe DECIMAL(15,2) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cfdi_id) REFERENCES cfdi(id) ON DELETE CASCADE,
    INDEX idx_cfdi_id (cfdi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: validaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS validaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cfdi_id INT NOT NULL,
    tipo_validacion ENUM('estructura', 'sat', 'netsuite', 'montos', 'fiscal') NOT NULL,
    resultado ENUM('exitoso', 'error', 'advertencia') NOT NULL,
    mensaje TEXT,
    detalles JSON,
    validado_por VARCHAR(100),
    fecha_validacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cfdi_id) REFERENCES cfdi(id) ON DELETE CASCADE,
    INDEX idx_cfdi_id (cfdi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERTAR CLIENTE DE PRUEBA (si no existe)
-- =====================================================
INSERT INTO clients (client_id, client_name, rfc, razon_social, email, plan_type, is_active)
VALUES ('COLIMAN001', 'Coliman', 'COL850101AAA', 'Coliman SA de CV', 'contacto@coliman.com', 'empresarial', TRUE)
ON DUPLICATE KEY UPDATE client_name = VALUES(client_name);

SELECT 'Tablas de CFDI creadas exitosamente!' AS Resultado;
