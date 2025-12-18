# 🚀 Acceso Rápido a Gestión de Usuarios

Si el menú "Usuarios" no aparece en el sidebar, puedes acceder directamente por URL:

## 📍 Acceso Directo

### Opción 1: URL Directa
1. Inicia sesión en http://localhost:3000
2. **Navega directamente a**: http://localhost:3000/usuarios
3. Presiona Enter

### Opción 2: Desde el Navegador
1. Una vez logueado, en la barra de direcciones escribe:
   ```
   http://localhost:3000/usuarios
   ```
2. La página de Usuarios se cargará directamente

---

## 🔧 Si el Menú No Aparece

### Causa Probable:
El menú "Usuarios" solo se muestra para usuarios con rol **Admin** o **Superadmin**.

### Verificación:
1. Inicia sesión con:
   - Email: `admin@coliman.com`
   - Password: `Admin123!`

2. En la esquina superior derecha, verifica tu rol
3. Debe decir "SUPERADMIN" o "ADMIN"

### Solución:
Si aún no aparece después de iniciar sesión con el superadmin:

1. **Cierra sesión** (botón de logout)
2. **Cierra el navegador completamente**
3. **Abre el navegador nuevamente**
4. **Inicia sesión otra vez**
5. **Accede directamente**: http://localhost:3000/usuarios

---

## 📋 Credenciales del Superadmin

```
Email:    admin@coliman.com
Password: Admin123!
```

---

## 🎯 Qué Verás

Al acceder a `/usuarios` verás:

### Tabs Disponibles:
1. **Información** - Roles y funcionalidades
2. **Listado de Usuarios** - Tabla completa con CRUD
3. **Estadísticas** - Próximamente

### Funcionalidades:
- ✅ Crear nuevo usuario (botón "Nuevo Usuario")
- ✅ Editar usuario (icono lápiz ✏️)
- ✅ Desactivar/Activar usuarios (iconos ❌/✓)
- ✅ Filtrar por nombre, email, rol, estado
- ✅ Exportar a Excel
- ✅ Paginación (10, 25, 50, 100 registros)

---

## 🐛 Troubleshooting

### Error 403 Forbidden
- **Causa**: Tu usuario no tiene permisos
- **Solución**: Inicia sesión con `admin@coliman.com`

### Página en blanco
- **Causa**: Frontend no compiló correctamente
- **Solución**:
  ```bash
  cd C:\Git\Coliman\portal-coliman
  docker-compose restart frontend
  ```

### "Cannot GET /usuarios"
- **Causa**: Frontend no está corriendo
- **Solución**:
  ```bash
  cd C:\Git\Coliman\portal-coliman
  docker-compose up -d
  ```

---

## 💡 Tip

**Añade la URL a Favoritos:**
1. Navega a http://localhost:3000/usuarios
2. Presiona `Ctrl + D` para añadir a favoritos
3. Nómbralo "Portal COLIMAN - Usuarios"

Así tendrás acceso rápido siempre!

---

**Última actualización:** 2025-12-15 15:00
