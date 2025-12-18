-- =====================================================
-- Portal COLIMAN - Schema Completo de Base de Datos
-- Sistema de validación de CFDIs con autenticación
-- Versión: 2.0
-- =====================================================

USE coliman_portal;

-- =====================================================
-- TABLA: users
-- Descripción: Usuarios del sistema con roles y multi-tenancy
-- =====================================================
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
    INDEX idx_client_id (client_id),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: clients
-- Descripción: Clientes que rentan el portal (multi-tenancy)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    regimen_fiscal VARCHAR(100) NULL,
    codigo_postal VARCHAR(10) NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'México',
    plan_type ENUM('basico', 'profesional', 'empresarial', 'corporativo') DEFAULT 'basico',
    max_users INT DEFAULT 5,
    max_cfdis_monthly INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_start DATE NULL,
    subscription_end DATE NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_rfc (rfc),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: suppliers (proveedores)
-- Descripción: Proveedores de los clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    rfc VARCHAR(13) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    regimen_fiscal VARCHAR(100) NULL,
    codigo_postal VARCHAR(10) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'México',
    contact_name VARCHAR(255) NULL,
    contact_position VARCHAR(100) NULL,
    contact_phone VARCHAR(20) NULL,
    contact_email VARCHAR(255) NULL,
    banco VARCHAR(100) NULL,
    cuenta_bancaria VARCHAR(50) NULL,
    clabe VARCHAR(18) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notas TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_supplier_per_client (client_id, rfc),
    INDEX idx_client_id (client_id),
    INDEX idx_rfc (rfc),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: constancias_fiscales
-- Descripción: Constancias de Situación Fiscal en PDF
-- =====================================================
CREATE TABLE IF NOT EXISTS constancias_fiscales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    rfc VARCHAR(13) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    tipo_constancia ENUM('persona_fisica', 'persona_moral') DEFAULT 'persona_moral',
    fecha_emision DATE NULL,
    fecha_vencimiento DATE NULL,
    tamano_archivo BIGINT NULL COMMENT 'Tamano en bytes',
    hash_archivo VARCHAR(64) NULL COMMENT 'SHA256 del archivo',
    uploaded_by INT NOT NULL,
    notas TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_rfc (rfc),
    INDEX idx_fecha_emision (fecha_emision),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: configurations
-- Descripción: Configuraciones generales del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_category ENUM('email', 'folders', 'mcp', 'ai', 'general') NOT NULL,
    config_value TEXT NULL,
    config_json JSON NULL,
    description TEXT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    updated_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_config_per_client (client_id, config_key),
    INDEX idx_client_id (client_id),
    INDEX idx_config_category (config_category),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: email_configurations
-- Descripción: Configuración específica de correo electrónico
-- =====================================================
CREATE TABLE IF NOT EXISTS email_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT DEFAULT 587,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL COMMENT 'Encriptado',
    smtp_use_tls BOOLEAN DEFAULT TRUE,
    smtp_use_ssl BOOLEAN DEFAULT FALSE,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NULL,
    reply_to_email VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email_config_per_client (client_id),
    INDEX idx_client_id (client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: folder_configurations
-- Descripción: Configuración de carpetas y rutas del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS folder_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    folder_type ENUM('uploads', 'exports', 'reports', 'temp', 'backups', 'cfdis') NOT NULL,
    folder_path VARCHAR(500) NOT NULL,
    max_size_mb INT DEFAULT 1024 COMMENT 'Tamaño máximo en MB',
    auto_cleanup BOOLEAN DEFAULT FALSE,
    cleanup_days INT DEFAULT 30 COMMENT 'Días antes de limpiar',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_folder_per_client (client_id, folder_type),
    INDEX idx_client_id (client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: templates
-- Descripción: Plantillas de colores y temas del portal
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_display_name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(7) NOT NULL COMMENT 'Hex color',
    secondary_color VARCHAR(7) NOT NULL COMMENT 'Hex color',
    accent_color VARCHAR(7) NULL COMMENT 'Hex color',
    background_color VARCHAR(7) NULL COMMENT 'Hex color',
    text_color VARCHAR(7) NULL COMMENT 'Hex color',
    sidebar_color VARCHAR(7) NULL COMMENT 'Hex color',
    gradient_start VARCHAR(7) NULL COMMENT 'Hex color',
    gradient_end VARCHAR(7) NULL COMMENT 'Hex color',
    config_json JSON NULL COMMENT 'Configuración completa en JSON',
    preview_image_url VARCHAR(500) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_name (template_name),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: client_templates
-- Descripción: Relación entre clientes y sus plantillas seleccionadas
-- =====================================================
CREATE TABLE IF NOT EXISTS client_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    template_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_by INT NULL,
    INDEX idx_client_id (client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE RESTRICT,
    FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: mcp_configurations
-- Descripción: Configuración de conexiones MCP (Model Context Protocol)
-- =====================================================
CREATE TABLE IF NOT EXISTS mcp_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    connection_name VARCHAR(100) NOT NULL,
    mcp_endpoint VARCHAR(500) NOT NULL,
    mcp_api_key VARCHAR(255) NULL COMMENT 'Encriptado',
    mcp_protocol ENUM('http', 'https', 'grpc', 'websocket') DEFAULT 'https',
    timeout_seconds INT DEFAULT 30,
    max_retries INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    last_connection_test DATETIME NULL,
    last_connection_status ENUM('success', 'failed', 'pending') NULL,
    connection_metadata JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_mcp_connection_per_client (client_id, connection_name),
    INDEX idx_client_id (client_id),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: ai_configurations
-- Descripción: Configuración de proveedores de IA
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    ai_provider ENUM('vertex', 'gemini', 'azure', 'openai', 'anthropic', 'cohere', 'huggingface') NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) NOT NULL COMMENT 'Encriptado',
    api_endpoint VARCHAR(500) NULL,
    model_name VARCHAR(100) NULL,
    max_tokens INT DEFAULT 1024,
    temperature DECIMAL(3,2) DEFAULT 0.70,
    additional_params JSON NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ai_provider_per_client (client_id, ai_provider, provider_name),
    INDEX idx_client_id (client_id),
    INDEX idx_ai_provider (ai_provider),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: kpis
-- Descripción: Definición de KPIs del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    kpi_code VARCHAR(50) NOT NULL,
    kpi_name VARCHAR(255) NOT NULL,
    kpi_description TEXT NULL,
    kpi_category ENUM('financiero', 'operacional', 'fiscal', 'compliance', 'general') DEFAULT 'general',
    kpi_type ENUM('number', 'percentage', 'currency', 'count', 'ratio') DEFAULT 'number',
    kpi_formula TEXT NULL COMMENT 'Fórmula de cálculo',
    target_value DECIMAL(15,2) NULL,
    warning_threshold DECIMAL(15,2) NULL,
    critical_threshold DECIMAL(15,2) NULL,
    unit VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_kpi_per_client (client_id, kpi_code),
    INDEX idx_client_id (client_id),
    INDEX idx_kpi_category (kpi_category),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: kpi_values
-- Descripción: Valores históricos de los KPIs
-- =====================================================
CREATE TABLE IF NOT EXISTS kpi_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kpi_id INT NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'daily',
    period_date DATE NOT NULL,
    metadata JSON NULL,
    calculated_by VARCHAR(50) DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kpi_id (kpi_id),
    INDEX idx_client_id (client_id),
    INDEX idx_period_date (period_date),
    UNIQUE KEY unique_kpi_value_per_period (kpi_id, period_date),
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: reports
-- Descripción: Reportes generados del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    report_type ENUM('kpi', 'cfdi', 'fiscal', 'financial', 'custom') NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    report_description TEXT NULL,
    report_config JSON NULL,
    schedule_type ENUM('manual', 'daily', 'weekly', 'monthly', 'quarterly') DEFAULT 'manual',
    recipients TEXT NULL COMMENT 'Emails separados por comas',
    last_generated_at DATETIME NULL,
    last_generated_by INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_report_type (report_type),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (last_generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: report_executions
-- Descripción: Historial de ejecuciones de reportes
-- =====================================================
CREATE TABLE IF NOT EXISTS report_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    execution_status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    file_path VARCHAR(500) NULL,
    file_format ENUM('pdf', 'excel', 'csv', 'json', 'xml') DEFAULT 'pdf',
    file_size BIGINT NULL COMMENT 'Tamaño en bytes',
    parameters JSON NULL,
    error_message TEXT NULL,
    executed_by INT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_report_id (report_id),
    INDEX idx_client_id (client_id),
    INDEX idx_execution_status (execution_status),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: charts
-- Descripción: Configuración de gráficas del dashboard
-- =====================================================
CREATE TABLE IF NOT EXISTS charts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    chart_name VARCHAR(255) NOT NULL,
    chart_type ENUM('line', 'bar', 'pie', 'donut', 'area', 'stacked_bar', 'radar', 'scatter') NOT NULL,
    chart_category ENUM('kpi', 'financial', 'fiscal', 'operational', 'custom') DEFAULT 'custom',
    data_source ENUM('kpi', 'mcp', 'database', 'api') DEFAULT 'kpi',
    data_config JSON NULL COMMENT 'Configuración de datos',
    chart_config JSON NULL COMMENT 'Configuración de visualización',
    refresh_interval INT DEFAULT 300 COMMENT 'Segundos',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_chart_type (chart_type),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: chart_data
-- Descripción: Datos de las gráficas (cache)
-- =====================================================
CREATE TABLE IF NOT EXISTS chart_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chart_id INT NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    data_point JSON NOT NULL,
    period_date DATE NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chart_id (chart_id),
    INDEX idx_client_id (client_id),
    INDEX idx_period_date (period_date),
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: menu_items
-- Descripción: Items del menú dinámico del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_key VARCHAR(50) NOT NULL UNIQUE,
    menu_label VARCHAR(100) NOT NULL,
    menu_icon VARCHAR(50) NULL COMMENT 'Material-UI icon name',
    menu_path VARCHAR(255) NULL,
    parent_id INT NULL,
    display_order INT DEFAULT 0,
    required_role ENUM('superadmin', 'admin', 'contador', 'analista', 'consulta') NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_menu_key (menu_key),
    INDEX idx_parent_id (parent_id),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: audit_log
-- Descripción: Log de auditoría de acciones del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(50) NULL,
    user_id INT NULL,
    action_type ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import') NOT NULL,
    entity_type VARCHAR(100) NULL COMMENT 'Tabla o entidad afectada',
    entity_id INT NULL,
    action_description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE CFDIs (del esquema original)
-- =====================================================

-- Tabla: ordenes_compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) NOT NULL,
    numero_orden VARCHAR(50) NOT NULL,
    supplier_id INT NOT NULL,
    fecha_orden DATE NOT NULL,
    monto_total DECIMAL(15,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    estatus ENUM('pendiente', 'parcial', 'completa', 'cancelada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_orden_per_client (client_id, numero_orden),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    INDEX idx_numero_orden (numero_orden),
    INDEX idx_supplier (supplier_id),
    INDEX idx_fecha (fecha_orden),
    INDEX idx_estatus (estatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cfdi
CREATE TABLE IF NOT EXISTS cfdi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) NOT NULL,
    uuid VARCHAR(36) NOT NULL,
    tipo_comprobante ENUM('I', 'E', 'T', 'N', 'P') NOT NULL,
    serie VARCHAR(25),
    folio VARCHAR(40),
    fecha DATETIME NOT NULL,

    -- Emisor
    emisor_rfc VARCHAR(13) NOT NULL,
    emisor_nombre VARCHAR(255),
    emisor_regimen VARCHAR(3),

    -- Receptor
    receptor_rfc VARCHAR(13) NOT NULL,
    receptor_nombre VARCHAR(255),
    receptor_uso_cfdi VARCHAR(3),

    -- Montos
    subtotal DECIMAL(15,2) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    tipo_cambio DECIMAL(10,4) DEFAULT 1,

    -- Impuestos
    total_impuestos_trasladados DECIMAL(15,2),
    total_impuestos_retenidos DECIMAL(15,2),

    -- Pago
    metodo_pago VARCHAR(3),
    forma_pago VARCHAR(3),
    condiciones_pago VARCHAR(255),

    -- Referencias
    orden_compra_id INT,

    -- Archivos
    xml_path VARCHAR(500),
    pdf_path VARCHAR(500),

    -- Validación
    estatus_validacion ENUM('pendiente', 'valido', 'rechazado', 'revisión') DEFAULT 'pendiente',
    fecha_validacion TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_uuid_per_client (client_id, uuid),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id),
    INDEX idx_uuid (uuid),
    INDEX idx_emisor_rfc (emisor_rfc),
    INDEX idx_receptor_rfc (receptor_rfc),
    INDEX idx_fecha (fecha),
    INDEX idx_estatus (estatus_validacion),
    INDEX idx_tipo (tipo_comprobante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cfdi_conceptos
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
    INDEX idx_cfdi_id (cfdi_id),
    INDEX idx_clave_prod (clave_prod_serv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: validaciones
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
    INDEX idx_cfdi_id (cfdi_id),
    INDEX idx_resultado (resultado),
    INDEX idx_tipo (tipo_validacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: movimientos_bancarios
CREATE TABLE IF NOT EXISTS movimientos_bancarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    cuenta VARCHAR(50) NOT NULL,
    fecha_operacion DATE NOT NULL,
    fecha_valor DATE,
    referencia VARCHAR(100),
    concepto TEXT,
    cargo DECIMAL(15,2),
    abono DECIMAL(15,2),
    saldo DECIMAL(15,2),
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Conciliación
    conciliado BOOLEAN DEFAULT FALSE,
    cfdi_id INT,
    fecha_conciliacion TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (cfdi_id) REFERENCES cfdi(id),
    INDEX idx_fecha (fecha_operacion),
    INDEX idx_referencia (referencia),
    INDEX idx_conciliado (conciliado),
    INDEX idx_banco (banco)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: conciliaciones
CREATE TABLE IF NOT EXISTS conciliaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) NOT NULL,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    banco VARCHAR(100) NOT NULL,
    total_movimientos INT NOT NULL,
    total_conciliados INT DEFAULT 0,
    total_pendientes INT DEFAULT 0,
    monto_conciliado DECIMAL(15,2) DEFAULT 0,
    monto_pendiente DECIMAL(15,2) DEFAULT 0,
    estatus ENUM('en_proceso', 'completada', 'revisión') DEFAULT 'en_proceso',
    generado_por INT NULL,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_periodo_banco_client (client_id, periodo, banco),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (generado_por) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_periodo (periodo),
    INDEX idx_estatus (estatus),
    INDEX idx_banco (banco)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERTAR PLANTILLAS DE COLORES POR DEFECTO
-- =====================================================
INSERT INTO templates (template_name, template_display_name, primary_color, secondary_color, accent_color, background_color, text_color, sidebar_color, gradient_start, gradient_end, is_default, config_json) VALUES
('purple_blue', 'Púrpura y Azul (Default)', '#667eea', '#764ba2', '#8b5cf6', '#f5f5f5', '#1a202c', '#2d3748', '#667eea', '#764ba2', TRUE,
'{"theme": "purple_blue", "shadows": true, "borderRadius": 8, "fontFamily": "Roboto, sans-serif"}'),

('ocean_breeze', 'Brisa del Océano', '#0ea5e9', '#06b6d4', '#3b82f6', '#f0f9ff', '#0c4a6e', '#075985', '#0ea5e9', '#06b6d4', FALSE,
'{"theme": "ocean_breeze", "shadows": true, "borderRadius": 12, "fontFamily": "Inter, sans-serif"}'),

('emerald_forest', 'Bosque Esmeralda', '#10b981', '#059669', '#34d399', '#f0fdf4', '#064e3b', '#065f46', '#10b981', '#059669', FALSE,
'{"theme": "emerald_forest", "shadows": true, "borderRadius": 10, "fontFamily": "Poppins, sans-serif"}'),

('sunset_orange', 'Atardecer Naranja', '#f97316', '#ea580c', '#fb923c', '#fff7ed', '#7c2d12', '#9a3412', '#f97316', '#ea580c', FALSE,
'{"theme": "sunset_orange", "shadows": true, "borderRadius": 6, "fontFamily": "Montserrat, sans-serif"}')
ON DUPLICATE KEY UPDATE template_display_name=VALUES(template_display_name);

-- =====================================================
-- INSERTAR ITEMS DE MENÚ POR DEFECTO
-- =====================================================
INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role) VALUES
-- Menú Principal
('dashboard', 'Dashboard', 'DashboardIcon', '/dashboard', NULL, 1, 'consulta'),
('configuracion', 'Configuración', 'SettingsIcon', NULL, NULL, 2, 'admin'),
('reportes', 'Reportes', 'AssessmentIcon', NULL, NULL, 3, 'analista'),
('charts', 'Gráficas', 'BarChartIcon', '/charts', NULL, 4, 'consulta'),
('catalogos', 'Catálogos', 'FolderIcon', NULL, NULL, 5, 'contador')
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

-- Submenú Configuración
INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_constancia', 'Constancia Fiscal', 'DescriptionIcon', '/configuracion/constancia', id, 1, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_email', 'Correo Electrónico', 'EmailIcon', '/configuracion/email', id, 2, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_folders', 'Carpetas', 'FolderOpenIcon', '/configuracion/folders', id, 3, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_templates', 'Plantillas y Temas', 'PaletteIcon', '/configuracion/templates', id, 4, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_mcp', 'Conexión MCP', 'CloudIcon', '/configuracion/mcp', id, 5, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'config_ai', 'Configuración IA', 'SmartToyIcon', '/configuracion/ai', id, 6, 'admin'
FROM menu_items WHERE menu_key = 'configuracion'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

-- Submenú Reportes
INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'reportes_kpi', 'KPIs', 'TrendingUpIcon', '/reportes/kpi', id, 1, 'analista'
FROM menu_items WHERE menu_key = 'reportes'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'reportes_fiscal', 'Reportes Fiscales', 'ReceiptIcon', '/reportes/fiscal', id, 2, 'contador'
FROM menu_items WHERE menu_key = 'reportes'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'reportes_ejecutivo', 'Reportes Ejecutivos', 'BusinessCenterIcon', '/reportes/ejecutivo', id, 3, 'admin'
FROM menu_items WHERE menu_key = 'reportes'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

-- Submenú Catálogos
INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'catalogos_clientes', 'Clientes', 'BusinessIcon', '/catalogos/clientes', id, 1, 'contador'
FROM menu_items WHERE menu_key = 'catalogos'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'catalogos_usuarios', 'Usuarios', 'PeopleIcon', '/catalogos/usuarios', id, 2, 'admin'
FROM menu_items WHERE menu_key = 'catalogos'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

INSERT INTO menu_items (menu_key, menu_label, menu_icon, menu_path, parent_id, display_order, required_role)
SELECT 'catalogos_proveedores', 'Proveedores', 'LocalShippingIcon', '/catalogos/proveedores', id, 3, 'contador'
FROM menu_items WHERE menu_key = 'catalogos'
ON DUPLICATE KEY UPDATE menu_label=VALUES(menu_label);

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

SELECT 'Schema de Portal COLIMAN creado exitosamente con todas las tablas' AS Message;
