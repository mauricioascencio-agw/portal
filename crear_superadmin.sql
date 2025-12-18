-- Script para crear un usuario SUPERADMIN en Portal COLIMAN
-- Ejecuta este script en tu base de datos MySQL

USE coliman_db;

-- Contraseña: Admin123! (ya hasheada con bcrypt)
-- IMPORTANTE: Cambia esta contraseña después del primer login

INSERT INTO users (
    email,
    hashed_password,
    full_name,
    role,
    client_id,
    client_name,
    is_active,
    is_superuser,
    is_verified,
    phone,
    company,
    position,
    created_at,
    updated_at
) VALUES (
    'admin@coliman.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKGMusoK8O',  -- Admin123!
    'Administrador del Sistema',
    'superadmin',
    'COLIMAN',
    'COLIMAN Portal',
    1,  -- is_active
    1,  -- is_superuser
    1,  -- is_verified
    '+52 123 456 7890',
    'COLIMAN',
    'Super Administrador',
    NOW(),
    NOW()
);

-- Verificar que se creó correctamente
SELECT
    id,
    email,
    full_name,
    role,
    is_active,
    is_superuser,
    created_at
FROM users
WHERE email = 'admin@coliman.com';
