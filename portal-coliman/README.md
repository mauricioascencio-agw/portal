# 🚀 Portal AgentSat

Sistema de validación de CFDIs con autenticación completa, diseñado para ser rentado a clientes.

## ✨ Características

### 🔐 Autenticación y Seguridad
- ✅ Login y Registro con diseño elegante
- ✅ JWT (JSON Web Tokens) para autenticación segura
- ✅ Roles de usuario (Superadmin, Admin, Contador, Analista, Consulta)
- ✅ Multi-tenancy (multi-cliente)
- ✅ Protección de rutas
- ✅ Contraseñas hasheadas con bcrypt

### 🎨 Frontend Moderno
- ✅ React 18 con TypeScript
- ✅ Material-UI (MUI) - Diseño profesional
- ✅ Responsive Design (móvil, tablet, desktop)
- ✅ Diseño elegante con gradientes y animaciones
- ✅ React Router para navegación
- ✅ React Query para gestión de estado

### ⚡ Backend Robusto
- ✅ FastAPI (Python) - Alto rendimiento
- ✅ SQLAlchemy ORM
- ✅ MySQL 8.0
- ✅ Pydantic para validación
- ✅ CORS configurado
- ✅ API REST documentada automáticamente (Swagger/OpenAPI)

### 🐳 Docker
- ✅ Docker Compose para orquestación
- ✅ 3 contenedores: Backend, Frontend, Database
- ✅ **Un solo comando para levantar todo**
- ✅ Sin configuración manual
- ✅ Instalación automática de dependencias

---

## 📋 Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado en Windows
- Git (opcional, para clonar el repositorio)

---

## 🚀 Instalación y Despliegue

### Opción 1: Levantamiento Completo (Recomendado)

```bash
# 1. Navegar a la carpeta del proyecto
cd C:\Git\Coliman\portal-coliman

# 2. Levantar todos los servicios (Backend, Frontend, Database)
docker-compose up --build
```

**¡Eso es todo!** 🎉

### Servicios Disponibles

Después de ejecutar `docker-compose up --build`, los servicios estarán disponibles en:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Aplicación React |
| **Backend API** | http://localhost:8001 | API FastAPI |
| **API Docs** | http://localhost:8001/docs | Documentación Swagger |
| **Base de Datos** | localhost:3307 | MySQL |

---

## 📖 Guía de Uso

### 1. Primera Vez - Registro de Usuario

1. Abre tu navegador en: http://localhost:3000
2. Serás redirigido a la página de Login
3. Haz clic en **"Regístrate aquí"**
4. Completa el formulario de registro:
   - Nombre completo
   - Email
   - Contraseña (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números)
   - Empresa (opcional)
   - Teléfono (opcional)
   - Puesto (opcional)
5. Haz clic en **"Crear Cuenta"**
6. Serás redirigido automáticamente al Dashboard

### 2. Login - Usuarios Existentes

1. Abre http://localhost:3000
2. Ingresa tu email y contraseña
3. Haz clic en **"Iniciar Sesión"**
4. Serás redirigido al Dashboard

### 3. Dashboard

El dashboard muestra:
- Información del usuario actual
- Email, rol y empresa
- Botones para funcionalidades futuras (CFDIs, Reportes)

---

## 🏗️ Arquitectura del Proyecto

```
portal-coliman/
├── backend/                    # Backend FastAPI (Python)
│   ├── app/
│   │   ├── api/               # Endpoints de la API
│   │   │   └── auth.py        # Autenticación (login, register)
│   │   ├── core/              # Configuración y seguridad
│   │   │   ├── config.py      # Variables de entorno
│   │   │   └── security.py    # JWT, hashing, autenticación
│   │   ├── db/                # Base de datos
│   │   │   └── database.py    # Conexión SQLAlchemy
│   │   ├── models/            # Modelos ORM
│   │   │   └── user.py        # Modelo de Usuario
│   │   ├── schemas/           # Schemas Pydantic
│   │   │   └── user.py        # Validación de datos
│   │   └── main.py            # App principal
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Frontend React + TypeScript
│   ├── src/
│   │   ├── contexts/          # Contextos React
│   │   │   └── AuthContext.tsx
│   │   ├── pages/             # Páginas
│   │   │   ├── Login.tsx      # Página de login elegante
│   │   │   ├── Register.tsx   # Página de registro elegante
│   │   │   └── Dashboard.tsx  # Dashboard principal
│   │   ├── services/          # Servicios
│   │   │   └── api.ts         # Cliente Axios configurado
│   │   ├── App.tsx            # App principal con rutas
│   │   └── index.tsx          # Entry point
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker/                     # Scripts Docker
│   └── mysql/
│       └── init.sql           # Inicialización de BD
│
└── docker-compose.yml          # Orquestación de servicios
```

---

## 🔧 Comandos Útiles

### Docker

```bash
# Levantar servicios (primera vez)
docker-compose up --build

# Levantar servicios (después de la primera vez)
docker-compose up

# Levantar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart backend
docker-compose restart frontend
```

### Base de Datos

```bash
# Conectar a MySQL desde Docker
docker exec -it agentsat_db mysql -u root -p
# Password: AgentSat2025!

# Dentro de MySQL
USE agentsat_portal;
SHOW TABLES;
SELECT * FROM users;
```

### Backend

```bash
# Ejecutar comando en el contenedor backend
docker exec -it agentsat_backend bash

# Dentro del contenedor
python -m pytest  # Ejecutar tests
```

---

## 🔐 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **superadmin** | Administrador del sistema | Acceso total, gestión de clientes |
| **admin** | Administrador de cliente | Gestión de usuarios de su empresa |
| **contador** | Contador | Validación, reportes completos |
| **analista** | Analista fiscal | Validación y análisis |
| **consulta** | Solo consulta | Ver reportes y CFDIs |

---

## 🗄️ Estructura de Base de Datos

### Base de Datos Completa

El sistema cuenta con **25 tablas** organizadas en los siguientes módulos:

**Gestión de Usuarios y Clientes:**
- `users` - Usuarios del sistema con roles
- `clients` - Clientes que rentan el portal
- `suppliers` - Proveedores de clientes

**Configuración del Sistema:**
- `configurations` - Configuraciones generales
- `email_configurations` - Configuración de correo
- `folder_configurations` - Configuración de carpetas
- `templates` - Plantillas de colores y temas (4 temas predefinidos)
- `client_templates` - Relación clientes-plantillas
- `mcp_configurations` - Configuración MCP
- `ai_configurations` - Configuración de proveedores IA (Vertex, Gemini, Azure, OpenAI, etc.)

**Reportes y KPIs:**
- `kpis` - Definición de KPIs
- `kpi_values` - Valores históricos de KPIs
- `reports` - Reportes configurados
- `report_executions` - Historial de ejecuciones

**Gráficas y Visualización:**
- `charts` - Configuración de gráficas
- `chart_data` - Datos de gráficas (cache)

**CFDIs y Validación:**
- `constancias_fiscales` - PDFs de constancias
- `cfdi` - Comprobantes fiscales
- `cfdi_conceptos` - Conceptos de CFDIs
- `validaciones` - Validaciones de CFDIs
- `ordenes_compra` - Órdenes de compra

**Conciliación Bancaria:**
- `movimientos_bancarios` - Movimientos bancarios
- `conciliaciones` - Conciliaciones bancarias

**Sistema:**
- `menu_items` - Menú dinámico (17 items predefinidos)
- `audit_log` - Auditoría de acciones

### Tabla: `users`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| email | VARCHAR(255) | Email único |
| hashed_password | VARCHAR(255) | Contraseña hasheada |
| full_name | VARCHAR(255) | Nombre completo |
| role | ENUM | Rol del usuario |
| client_id | VARCHAR(50) | ID del cliente (multi-tenancy) |
| client_name | VARCHAR(255) | Nombre del cliente |
| company | VARCHAR(255) | Empresa |
| phone | VARCHAR(20) | Teléfono |
| position | VARCHAR(100) | Puesto |
| is_active | BOOLEAN | Usuario activo |
| is_superuser | BOOLEAN | Es superadmin |
| is_verified | BOOLEAN | Email verificado |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |
| last_login | DATETIME | Último login |

---

## 🔌 API Endpoints

### Autenticación

#### POST /api/auth/register
Registrar nuevo usuario

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123",
  "full_name": "Juan Pérez",
  "company": "Mi Empresa",
  "phone": "5551234567",
  "position": "Contador",
  "role": "contador"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "role": "contador",
  "is_active": true,
  "created_at": "2025-12-14T10:00:00"
}
```

#### POST /api/auth/login-json
Iniciar sesión

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "full_name": "Juan Pérez",
    "role": "contador"
  }
}
```

#### GET /api/auth/me
Obtener usuario actual (requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "role": "contador",
  "last_login": "2025-12-14T10:30:00"
}
```

---

## 🎨 Características del Diseño

### Login y Registro

- ✨ Diseño moderno con gradientes púrpura/azul
- 🎭 Animaciones suaves
- 📱 100% responsive
- 🔒 Validación de formularios en tiempo real
- 👁️ Toggle para mostrar/ocultar contraseña
- ⚡ Feedback visual de errores
- 🎯 UX profesional

### Paleta de Colores

```css
Primary: #667eea (Azul púrpura)
Secondary: #764ba2 (Púrpura)
Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Background Pattern: Patrón SVG con opacidad 0.05
```

---

## 🛠️ Configuración Avanzada

### Variables de Entorno

Crear archivo `.env` en `backend/`:

```env
# Base de datos
DATABASE_URL=mysql+pymysql://agentsat_user:AgentSat2025!@db:3306/agentsat_portal

# JWT
SECRET_KEY=tu_clave_secreta_muy_segura_cambiame_en_produccion_2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost
```

Crear archivo `.env` en `frontend/`:

```env
REACT_APP_API_URL=http://localhost:8001
```

---

## 🧪 Testing

```bash
# Backend tests
docker exec -it agentsat_backend pytest

# Frontend tests
docker exec -it agentsat_frontend npm test
```

---

## 🎨 Plantillas de Colores Predefinidas

El sistema incluye **4 plantillas de colores** que se pueden cambiar con un solo clic:

### 1. Púrpura y Azul (Default)
```css
Primary: #667eea
Secondary: #764ba2
Gradient: #667eea → #764ba2
```

### 2. Brisa del Océano
```css
Primary: #0ea5e9
Secondary: #06b6d4
Gradient: #0ea5e9 → #06b6d4
```

### 3. Bosque Esmeralda
```css
Primary: #10b981
Secondary: #059669
Gradient: #10b981 → #059669
```

### 4. Atardecer Naranja
```css
Primary: #f97316
Secondary: #ea580c
Gradient: #f97316 → #ea580c
```

Las plantillas se guardan en formato JSON y se pueden aplicar desde la sección de **Configuración → Plantillas y Temas**.

---

## 📋 Menú Dinámico del Sistema

El sistema cuenta con un **menú dinámico** basado en la base de datos con 17 items predefinidos:

### Menú Principal
- **Dashboard** - Vista principal con KPIs
- **Configuración** (Admin)
  - Constancia Fiscal - Upload de PDFs
  - Correo Electrónico - Configuración SMTP
  - Carpetas - Gestión de rutas
  - Plantillas y Temas - Cambio de colores
  - Conexión MCP - Configuración MCP
  - Configuración IA - API Keys (Vertex, Gemini, Azure, OpenAI, etc.)
- **Reportes** (Analista)
  - KPIs - Indicadores clave
  - Reportes Fiscales - Reportes CFDI
  - Reportes Ejecutivos - Reportes gerenciales
- **Gráficas** - Visualización de datos
- **Catálogos** (Contador)
  - Clientes - CRUD de clientes
  - Usuarios - CRUD de usuarios
  - Proveedores - CRUD de proveedores

Los items del menú se filtran automáticamente según el **rol del usuario**.

---

## 📦 Próximas Funcionalidades

### Fase 2 - Dashboard Completo
- [ ] Validación de CFDIs (XML)
- [ ] Descarga masiva del SAT
- [ ] Dashboards con gráficas (Recharts)
- [ ] Tablas profesionales con AG-Grid
- [ ] Exportación a Excel, CSV, PDF, XML, JSON

### Fase 3 - Reportes Avanzados
- [ ] Generación de reportes ejecutivos
- [ ] Conciliación bancaria
- [ ] Alertas automáticas
- [ ] Notificaciones por email

### Fase 4 - Multi-tenancy Completo
- [ ] Portal de administración de clientes
- [ ] Facturación por cliente
- [ ] Límites de uso por plan
- [ ] Analytics por cliente

---

## 🐛 Solución de Problemas

### El frontend no carga

```bash
# Verificar que el contenedor está corriendo
docker ps

# Ver logs
docker-compose logs frontend

# Reiniciar servicio
docker-compose restart frontend
```

### Error de conexión a la base de datos

```bash
# Verificar que MySQL está corriendo
docker ps | grep agentsat_db

# Ver logs de MySQL
docker-compose logs db

# Reiniciar MySQL
docker-compose restart db
```

### Puerto ya en uso

```bash
# Detener todos los servicios
docker-compose down

# Cambiar puerto en docker-compose.yml
# Por ejemplo, cambiar 3000:3000 a 3001:3000
```

---

## 📝 Notas de Desarrollo

### Para Desarrolladores

1. **Hot Reload**: Ambos servicios (frontend y backend) tienen hot reload activado
2. **Volúmenes**: Los cambios en el código se reflejan automáticamente
3. **Logs**: Usa `docker-compose logs -f` para debugging en tiempo real

### Credenciales por Defecto

**MySQL:**
- Usuario: `agentsat_user`
- Contraseña: `AgentSat2025!`
- Base de datos: `agentsat_portal`

**Primer Usuario:**
- Se crea mediante el formulario de registro
- No hay usuarios por defecto

---

## 📞 Soporte

Para reportar issues o solicitar funcionalidades:
- Email: soporte@agentsat.com
- Repositorio: Portal AgentSat

---

## 📄 Licencia

Copyright © 2025 Portal AgentSat. Todos los derechos reservados.

---

## 🎉 ¡Listo!

Tu portal está configurado y listo para usar. Solo ejecuta:

```bash
docker-compose up --build
```

Y abre http://localhost:3000 en tu navegador.

**¡Disfruta! 🚀**
