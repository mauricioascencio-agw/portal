-- Script de Inicialización de Base de Datos
-- Sistema de Validación CFDI - Grupo COLIMAN

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS coliman_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Crear usuario si no existe
CREATE USER IF NOT EXISTS 'coliman_user'@'%' IDENTIFIED BY 'Coliman2024!Secure';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON coliman_db.* TO 'coliman_user'@'%';
FLUSH PRIVILEGES;

-- Usar la base de datos
USE coliman_db;

SELECT 'Base de datos coliman_db inicializada correctamente' AS Message;
