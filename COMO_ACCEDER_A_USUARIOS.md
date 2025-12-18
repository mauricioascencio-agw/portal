# 🔐 Cómo Acceder a la Gestión de Usuarios

## ✅ Usuario SUPERADMIN Creado

Ya se ha creado un usuario con permisos de **SUPERADMIN** para que puedas acceder a todas las funcionalidades del sistema.

### 📋 Credenciales

```
Email:    admin@coliman.com
Password: Admin123!
```

**⚠️ IMPORTANTE: Cambia esta contraseña después del primer login por seguridad.**

---

## 🚀 Pasos para Acceder

### 1. Iniciar Sesión

1. Abre tu navegador en: **http://localhost:3000**
2. Ingresa las credenciales:
   - Email: `admin@coliman.com`
   - Contraseña: `Admin123!`
3. Click en "Iniciar Sesión"

### 2. Acceder a Gestión de Usuarios

Una vez dentro del sistema:

1. **Menú Lateral Izquierdo** → Busca el icono de **"Usuarios"** 👥
2. Click en **"Usuarios"**
3. Se abrirá la página de **Gestión de Usuarios**

---

## 🎯 Funcionalidades Disponibles

### En la Página de Usuarios:

#### ✅ Ver Lista de Usuarios
- Tabla con todos los usuarios del sistema
- Información: Nombre, Email, Rol, Cliente, Teléfono, Estado

#### 🔍 Filtros
- **Buscar**: Por nombre o email
- **Rol**: Filtrar por tipo de usuario
- **Estado**: Filtrar activos/inactivos

#### ➕ Crear Nuevo Usuario
1. Click en botón **"Nuevo Usuario"**
2. Llenar formulario:
   - Nombre Completo *
   - Email *
   - Contraseña * (mínimo 8 caracteres, con mayúsculas, minúsculas y números)
   - Rol (seleccionar uno)
   - Teléfono
   - ID Cliente
   - Nombre Cliente
   - Empresa
   - Posición
3. Click en **"Crear"**

#### ✏️ Editar Usuario
1. Click en icono de lápiz ✏️ en la fila del usuario
2. Modificar datos permitidos
3. Click en **"Actualizar"**

#### 🔴 Desactivar Usuario
1. Click en icono rojo ❌ en la fila del usuario
2. Confirmar acción
3. El usuario se desactivará (soft delete, no se elimina)

#### 🟢 Activar Usuario
1. Filtrar por "Inactivos"
2. Click en icono verde ✓ en la fila del usuario desactivado
3. El usuario se reactivará

---

## 👥 Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Super Administrador** | Control total del sistema | Todos los permisos |
| **Administrador** | Admin de cliente | Gestión de usuarios de su cliente |
| **Contador** | Contador fiscal | Acceso a CFDIs y reportes |
| **Analista Fiscal** | Analista | Reportes y análisis |
| **Solo Consulta** | Visualización | Solo lectura |

---

## 🔧 Cambiar Contraseña

### Desde tu Perfil:
1. Menu superior → Click en tu avatar
2. Seleccionar "Cambiar Contraseña"
3. Ingresar:
   - Contraseña actual
   - Nueva contraseña
4. Click en "Actualizar"

---

## 📝 Crear Más Usuarios SUPERADMIN (Si Necesitas)

Si en algún momento necesitas crear otro usuario con rol SUPERADMIN:

### Opción 1: Usando el Script Python (Desde Docker)

```bash
cd C:\Git\Coliman\portal-coliman
docker exec coliman_backend python crear_superadmin_simple.py
```

### Opción 2: Usando SQL Directo

Ejecuta el archivo `C:\Git\Coliman\crear_superadmin.sql` en tu base de datos MySQL.

### Opción 3: Desde la Web

1. Inicia sesión con el SUPERADMIN actual
2. Ve a **"Usuarios"**
3. Click **"Nuevo Usuario"**
4. Selecciona rol **"Super Administrador"**
5. Llena los datos y crea

---

## 🐛 Solución de Problemas

### No veo el menú "Usuarios"

**Posibles causas:**
1. Tu usuario no tiene rol `admin` o `superadmin`
2. Necesitas cerrar sesión y volver a iniciar con `admin@coliman.com`

**Solución:**
- Verifica tu rol en la esquina superior derecha
- Si no eres admin, inicia sesión con: `admin@coliman.com` / `Admin123!`

### Error al crear usuario

**Verificar:**
1. Email debe ser único (no duplicado)
2. Contraseña mínimo 8 caracteres
3. Contraseña debe incluir:
   - Al menos 1 mayúscula
   - Al menos 1 minúscula
   - Al menos 1 número

### No puedo activar/desactivar usuarios

**Verificar:**
- Solo usuarios con rol `admin` o `superadmin` pueden hacer esto
- No puedes desactivarte a ti mismo

---

## 🎉 Resumen Rápido

1. ✅ Inicia sesión: `admin@coliman.com` / `Admin123!`
2. ✅ Menu lateral → **"Usuarios"** 👥
3. ✅ Click **"Nuevo Usuario"** para crear
4. ✅ Usa los iconos ✏️ ❌ ✓ para editar/desactivar/activar

---

## 📞 Contacto y Soporte

Si tienes problemas o dudas:
- Revisa este documento primero
- Verifica que Docker esté corriendo: `docker ps`
- Revisa logs del backend: `docker logs coliman_backend`

---

**Última actualización:** 2025-12-15
