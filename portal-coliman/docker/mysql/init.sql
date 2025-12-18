-- Script de inicialización de base de datos
-- Portal AgentSat

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS agentsat_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agentsat_portal;

-- Las tablas se crearán automáticamente con SQLAlchemy
-- Este script solo asegura que la base de datos exista

-- Opcional: Crear usuario administrador inicial (se puede hacer via API también)
-- La contraseña hash se generará en el backend
