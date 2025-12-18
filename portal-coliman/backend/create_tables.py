#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para crear las tablas necesarias para CFDIs
Ejecutar: python create_tables.py
"""
import pymysql
import sys

# Configuración - CAMBIAR SEGÚN TU INSTALACIÓN
MYSQL_HOST = 'localhost'
MYSQL_PORT = 3306
MYSQL_USER = 'root'  # Cambiar por tu usuario
MYSQL_PASSWORD = ''  # Cambiar por tu contraseña de MySQL
MYSQL_DATABASE = 'agentsat_portal'

# SQL para crear las tablas
CREATE_TABLES_SQL = """
-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS agentsat_portal
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agentsat_portal;

-- Crear usuario si no existe
CREATE USER IF NOT EXISTS 'agentsat_user'@'localhost' IDENTIFIED BY 'AgentSat2025!';
GRANT ALL PRIVILEGES ON agentsat_portal.* TO 'agentsat_user'@'localhost';
FLUSH PRIVILEGES;

-- TABLA: clients
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

-- TABLA: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'contador', 'analista', 'consulta') DEFAULT 'consulta',
    client_id VARCHAR(50) NULL,
    client_name VARCHAR(255) NULL,
    company VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    position VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    INDEX idx_email (email),
    INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: cfdi
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

-- TABLA: cfdi_conceptos
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

-- TABLA: validaciones
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

-- Insertar cliente de prueba
INSERT INTO clients (client_id, client_name, rfc, razon_social, email, plan_type, is_active)
VALUES ('COLIMAN001', 'Coliman', 'COL850101AAA', 'Coliman SA de CV', 'contacto@coliman.com', 'empresarial', TRUE)
ON DUPLICATE KEY UPDATE client_name = VALUES(client_name);
"""

def main():
    print("=" * 60)
    print("Creando tablas para Portal AgentSat - CFDIs")
    print("=" * 60)

    # Si no hay contraseña configurada, pedir al usuario
    password = MYSQL_PASSWORD
    if not password:
        password = input("Ingresa la contraseña de root de MySQL: ")

    try:
        # Conectar a MySQL
        print(f"\nConectando a MySQL como {MYSQL_USER}@{MYSQL_HOST}...")
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=password,
            charset='utf8mb4',
            autocommit=True
        )

        cursor = conn.cursor()

        # Ejecutar cada statement por separado
        statements = [s.strip() for s in CREATE_TABLES_SQL.split(';') if s.strip()]

        for i, stmt in enumerate(statements, 1):
            if stmt and not stmt.startswith('--'):
                try:
                    cursor.execute(stmt)
                    # Mostrar progreso solo para statements importantes
                    if 'CREATE TABLE' in stmt:
                        table_name = stmt.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                        print(f"  ✓ Tabla {table_name} creada")
                    elif 'CREATE DATABASE' in stmt:
                        print(f"  ✓ Base de datos agentsat_portal creada")
                    elif 'CREATE USER' in stmt:
                        print(f"  ✓ Usuario agentsat_user creado")
                    elif 'INSERT INTO clients' in stmt:
                        print(f"  ✓ Cliente de prueba COLIMAN001 insertado")
                except pymysql.err.OperationalError as e:
                    if 'already exists' not in str(e):
                        print(f"  ! Advertencia: {e}")
                except Exception as e:
                    print(f"  ! Error en statement {i}: {e}")

        cursor.close()
        conn.close()

        print("\n" + "=" * 60)
        print("¡Tablas creadas exitosamente!")
        print("=" * 60)
        print("\nAhora puedes reiniciar el backend y subir CFDIs.")

    except pymysql.err.OperationalError as e:
        print(f"\n❌ Error de conexión: {e}")
        print("\nVerifica:")
        print("  1. MySQL está corriendo")
        print("  2. Usuario y contraseña son correctos")
        print("  3. Puerto 3306 está accesible")
        sys.exit(1)

if __name__ == "__main__":
    main()
