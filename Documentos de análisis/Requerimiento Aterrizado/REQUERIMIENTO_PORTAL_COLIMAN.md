# REQUERIMIENTO Y REGLAS DE NEGOCIO
## Portal Dashboard para Validación de CFDIs - Grupo COLIMAN

**Versión:** 1.0
**Fecha:** Diciembre 2025
**Proyecto:** Portal tipo Dashboard con herramientas MCP para validación SAT XML y Descarga masiva

---

## 1. OBJETIVO DEL PROYECTO

Desarrollar un **Portal tipo Dashboard** centralizado que permita a Grupo COLIMAN automatizar y gestionar de manera eficiente la validación de CFDIs (XML), descarga masiva de comprobantes fiscales, conciliación bancaria y reportes ejecutivos, eliminando procesos manuales y reduciendo errores operativos.

---

## 2. PROBLEMÁTICA ACTUAL

### 2.1 Situación Actual
- **Validación manual** de CFDIs consume entre 5-8 minutos por comprobante
- **Información dispersa** en múltiples archivos Excel y sistemas
- **Falta de trazabilidad** en el proceso de validación
- **Errores humanos** en captura y verificación (10-15% de incidencia)
- **Cuellos de botella** en períodos de cierre contable
- **No existe validación automática** contra el SAT
- **Proveedores externos (NetSuite)** no ofrecen soluciones integradas
- **Proceso de conciliación bancaria** toma 2-3 días al mes

### 2.2 Impacto Operativo
- Alto costo de horas/hombre
- Retrasos en pagos a proveedores
- Estrés del personal en cierres
- Imposibilidad de análisis predictivo
- Falta de alertas tempranas
- Dificultad para escalar el proceso

---

## 3. ALCANCE DEL PROYECTO

### 3.1 Módulos Principales

#### 3.1.1 Validación Automática de CFDIs
**Descripción:** Sistema que valida automáticamente los CFDIs (XML) contra catálogos del SAT y reglas fiscales.

**Funcionalidades:**
- ✅ Carga masiva de archivos XML
- ✅ Validación de estructura XML según estándar SAT
- ✅ Verificación de UUID ante el SAT (simulado/real)
- ✅ Validación de nodos críticos:
  - RFC emisor y receptor
  - Razón social
  - Régimen fiscal
  - Uso del CFDI
  - Forma de pago
  - Método de pago
  - Subtotal, IVA, Total
  - Fecha de emisión y certificación
  - Tipo de comprobante
- ✅ Cotejo contra órdenes de compra (si aplica)
- ✅ Validación de conceptos y productos
- ✅ Generación de reportes de errores detallados
- ✅ Clasificación automática (Válido/Rechazado/Pendiente)

**Reglas de Negocio:**
1. Un CFDI es **VÁLIDO** si cumple todas las validaciones
2. Un CFDI es **RECHAZADO** si falla al menos una validación crítica
3. Un CFDI es **PENDIENTE** si requiere revisión manual
4. El UUID debe ser único en el sistema
5. Se debe mantener historial de todas las validaciones
6. Se debe registrar fecha y hora de cada validación
7. Errores deben ser descriptivos y accionables

#### 3.1.2 Descarga Masiva de CFDIs
**Descripción:** Herramienta para descargar CFDIs del portal SAT de forma masiva y automatizada.

**Funcionalidades:**
- ✅ Conexión automática al portal del SAT
- ✅ Descarga masiva por rango de fechas
- ✅ Descarga por tipo (emitidos/recibidos)
- ✅ Almacenamiento organizado de XML + PDF
- ✅ Registro en base de datos de CFDIs descargados
- ✅ Validación automática post-descarga
- ✅ Notificación de nuevos comprobantes

**Reglas de Negocio:**
1. La descarga debe respetar límites del SAT
2. Se debe evitar duplicados en descarga
3. Cada CFDI descargado debe validarse automáticamente
4. Estructura de carpetas: Año/Mes/Tipo/RFC_UUID.xml
5. Mantener sincronización con SAT al menos 1 vez al día

#### 3.1.3 Dashboard Web Interactivo
**Descripción:** Portal web con visualización en tiempo real de KPIs y métricas fiscales.

**Funcionalidades:**
- ✅ **KPIs Configurables** (mínimo 8 disponibles):
  - Total de CFDIs procesados
  - CFDIs válidos
  - CFDIs rechazados
  - CFDIs pendientes
  - Monto total procesado
  - Monto válido
  - Porcentaje de aprobación
  - Promedio por CFDI
  - Total conciliado
  - Porcentaje de conciliación

- ✅ **Gráficas Interactivas:**
  - Gráfica de dona: Estado de CFDIs
  - Gráfica de barras: CFDIs por tipo de comprobante
  - Línea temporal: Validaciones por día
  - Heatmap: Errores por proveedor

- ✅ **Tabla Dinámica:**
  - Últimos 50 CFDIs procesados
  - Filtros por estado, fecha, proveedor
  - Búsqueda por UUID/RFC
  - Acciones: Validar, Ver detalle, Exportar

- ✅ **Actualización Automática:**
  - Auto-refresh cada 30 segundos
  - Notificaciones visuales de cambios
  - Indicadores de carga

**Reglas de Negocio:**
1. Dashboard debe cargar en menos de 3 segundos
2. Datos deben reflejar estado actual en tiempo real
3. Usuario puede personalizar KPIs mostrados
4. Dashboard debe ser responsive (móvil, tablet, desktop)
5. Colores deben seguir semáforo: Verde (OK), Amarillo (Advertencia), Rojo (Error)

#### 3.1.4 Conciliación Bancaria Inteligente
**Descripción:** Módulo que cruza movimientos bancarios con CFDIs para identificar coincidencias.

**Funcionalidades:**
- ✅ Importación de estados de cuenta bancarios
- ✅ Matching automático por:
  - Monto exacto
  - Fecha cercana (±3 días)
  - Referencia bancaria
- ✅ Scoring de probabilidad de match
- ✅ Conciliación manual para casos excepcionales
- ✅ Reporte de movimientos no conciliados
- ✅ Estadísticas de conciliación

**Reglas de Negocio:**
1. Un movimiento puede conciliar con múltiples CFDIs (pagos parciales)
2. Un CFDI puede conciliar con múltiples movimientos (pagos parciales)
3. Tolerancia de monto: ±$0.50 MXN
4. Tolerancia de fecha: ±3 días hábiles
5. Match automático requiere 90% de certeza
6. Casos con < 90% requieren revisión manual
7. Movimientos conciliados no pueden desconciliarse sin autorización

#### 3.1.5 Sistema de Reportes Ejecutivos
**Descripción:** Generador de reportes profesionales para toma de decisiones.

**Tipos de Reportes:**
1. **Reporte Resumen Ejecutivo:**
   - Total de CFDIs
   - Distribución por estado
   - Monto total
   - Tasa de aprobación
   - Top 5 errores

2. **Reporte por Tipo de Comprobante:**
   - Facturas (I - Ingreso)
   - Notas de crédito (E - Egreso)
   - Complementos de pago (P)
   - Nómina (N)

3. **Reporte de Distribución de Montos:**
   - Rangos de monto
   - Montos por proveedor
   - Análisis de desviaciones

4. **Reporte de Errores:**
   - Top 10 errores más frecuentes
   - Errores por campo
   - Evolución temporal de errores

5. **Reporte de Proveedores con Problemas:**
   - Proveedores con más rechazos
   - Proveedores con errores recurrentes
   - Recomendaciones de capacitación

6. **Reporte de Conciliación Bancaria:**
   - Movimientos conciliados vs pendientes
   - Diferencias encontradas
   - Saldo conciliado

**Reglas de Negocio:**
1. Reportes deben generarse en menos de 10 segundos
2. Formato profesional apto para presentaciones
3. Datos deben incluir fecha de generación
4. Posibilidad de exportar a PDF/Excel
5. Reportes deben incluir filtros aplicados
6. Gráficas deben ser legibles e interpretables

#### 3.1.6 Chatbot Terminal con IA
**Descripción:** Interfaz de línea de comandos con lenguaje natural para consultas rápidas.

**Comandos Especiales:**
- `/stats` - Estadísticas generales
- `/concilia` - Estado de conciliación
- `/errores` - Top errores frecuentes
- `/proveedores` - Proveedores con problemas
- `/lista` - Últimos 10 CFDIs
- `/validar <UUID>` - Validar CFDI específico
- `/help` - Ayuda y comandos
- `/salir` - Cerrar chatbot

**Consultas en Lenguaje Natural:**
- "¿Cuántos CFDIs válidos tenemos?"
- "¿Cuál es el monto total procesado?"
- "¿Qué proveedores tienen más rechazos?"
- "Muestra los CFDIs de esta semana"

**Reglas de Negocio:**
1. Respuestas deben ser concisas y claras
2. Comandos deben ejecutarse en < 2 segundos
3. Errores deben sugerir comandos correctos
4. Historial de conversación debe guardarse
5. IA debe aprender de consultas frecuentes

#### 3.1.7 API REST Completa
**Descripción:** API documentada para integración con sistemas externos.

**Endpoints Principales:**
- `GET /health` - Health check
- `GET /api/cfdi/stats` - Estadísticas generales
- `POST /api/cfdi/validar/{id}` - Validar un CFDI
- `GET /api/cfdi/rechazados` - Listar rechazados
- `GET /api/cfdi/errores/top` - Top errores
- `GET /api/conciliacion/estadisticas` - Estado conciliación
- `POST /api/conciliacion/ejecutar` - Ejecutar conciliación
- `GET /api/reportes/ejecutivo` - Reporte ejecutivo
- `GET /api/proveedores/con-errores` - Proveedores problemáticos

**Características:**
- ✅ Documentación automática (Swagger/OpenAPI)
- ✅ Respuestas en formato JSON
- ✅ Validación de entrada con Pydantic
- ✅ Manejo de errores HTTP estándar
- ✅ CORS configurado
- ✅ Versionado de API
- ✅ Rate limiting (futuro)
- ✅ Autenticación JWT (futuro)

**Reglas de Negocio:**
1. Tiempo de respuesta < 200ms (promedio)
2. Responses deben seguir estándar REST
3. Errores deben incluir mensaje descriptivo
4. Documentación debe estar siempre actualizada
5. API debe ser stateless

---

## 4. ACTORES DEL SISTEMA

### 4.1 Contador General
**Responsabilidades:**
- Supervisar validaciones masivas
- Generar reportes ejecutivos
- Tomar decisiones basadas en KPIs
- Configurar reglas de validación

**Acceso:**
- Dashboard completo
- Todos los reportes
- Configuración de sistema
- API REST

### 4.2 Analista Fiscal
**Responsabilidades:**
- Validar CFDIs individualmente
- Resolver casos pendientes
- Analizar errores recurrentes
- Contactar proveedores con problemas

**Acceso:**
- Dashboard de validación
- Chatbot para consultas
- Reportes de errores
- Validación manual

### 4.3 Asistente Contable
**Responsabilidades:**
- Consultas básicas de estado
- Descargas de reportes simples
- Verificación de CFDIs específicos

**Acceso:**
- Chatbot terminal
- Reportes básicos
- Consulta de CFDIs

### 4.4 Director Financiero
**Responsabilidades:**
- Revisión de KPIs estratégicos
- Presentaciones con reportes
- Decisiones de negocio

**Acceso:**
- Dashboard ejecutivo
- Reportes completos
- Exportación a PDF/Excel

### 4.5 Sistemas Externos (ERP, APIs)
**Responsabilidades:**
- Consumir datos vía API
- Enviar CFDIs para validación
- Sincronizar catálogos

**Acceso:**
- API REST completa
- Webhooks (futuro)

---

## 5. REGLAS DE NEGOCIO GENERALES

### 5.1 Validación de CFDIs

#### RN-001: Validación de UUID
- El UUID debe tener formato válido (36 caracteres)
- Debe ser único en el sistema
- Debe validarse contra el SAT (simulado o real)
- Estatus SAT: Vigente/Cancelado/No encontrado

#### RN-002: Validación de RFC
- RFC emisor debe existir en catálogo del SAT
- RFC receptor debe coincidir con RFC de Grupo COLIMAN
- Formato de RFC debe ser válido (13 o 12 caracteres)

#### RN-003: Validación de Montos
- Subtotal + IVA = Total (tolerancia ±$0.01)
- Montos deben ser mayores a $0.00
- Moneda debe ser MXN (o especificada)
- Tipo de cambio debe aplicarse si moneda extranjera

#### RN-004: Validación de Fechas
- Fecha de emisión no puede ser futura
- Fecha de certificación debe ser posterior a emisión
- Diferencia máxima entre emisión y certificación: 72 horas
- Fecha de pago no puede ser anterior a emisión

#### RN-005: Validación de Régimen Fiscal
- Régimen del emisor debe ser válido según catálogo SAT
- Régimen debe corresponder con el tipo de comprobante
- Cambios de régimen deben notificarse

#### RN-006: Validación de Uso de CFDI
- Uso del CFDI debe ser válido según catálogo SAT
- Debe corresponder con el tipo de comprobante
- G03 (Gastos en general) más común

#### RN-007: Validación de Forma de Pago
- Forma de pago debe estar en catálogo SAT
- 01 - Efectivo
- 03 - Transferencia electrónica
- 04 - Tarjeta de crédito
- 99 - Por definir

#### RN-008: Validación de Método de Pago
- PUE - Pago en una sola exhibición
- PPD - Pago en parcialidades o diferido
- Debe corresponder con forma de pago

### 5.2 Conciliación Bancaria

#### RN-009: Matching Automático
- Monto debe coincidir con tolerancia de ±$0.50
- Fecha debe estar en rango de ±3 días hábiles
- Referencia bancaria debe contener UUID o datos identificables
- Score de probabilidad debe ser ≥ 90% para auto-conciliar

#### RN-010: Pagos Parciales
- Un CFDI puede tener múltiples pagos
- Suma de pagos parciales no debe exceder total del CFDI
- Cada pago parcial debe registrarse individualmente
- Complemento de pago debe generarse automáticamente

#### RN-011: Movimientos No Conciliados
- Movimientos > 30 días sin conciliar deben alertarse
- Movimientos sin referencia requieren investigación
- Diferencias de monto deben justificarse

### 5.3 Reportes y Alertas

#### RN-012: Generación de Reportes
- Reportes deben generarse bajo demanda
- Datos deben ser consistentes con base de datos
- Filtros deben aplicarse correctamente
- Exportación debe mantener formato

#### RN-013: Alertas Automáticas
- Alerta si tasa de rechazo > 15%
- Alerta si proveedor tiene > 5 rechazos
- Alerta si CFDI no concilia en 7 días
- Alerta si UUID no valida contra SAT

### 5.4 Seguridad y Auditoría

#### RN-014: Trazabilidad
- Toda operación debe quedar registrada
- Log debe incluir: usuario, fecha/hora, acción, resultado
- Cambios manuales deben justificarse
- Historial debe ser inmutable

#### RN-015: Respaldos
- Respaldo automático de base de datos diario
- Retención de respaldos: 30 días
- Respaldo de archivos XML en almacenamiento seguro
- Plan de recuperación de desastres documentado

#### RN-016: Acceso y Permisos
- Usuarios deben autenticarse (futuro)
- Acciones deben estar autorizadas por rol
- Sesiones deben expirar después de inactividad
- Intentos fallidos de login deben bloquearse

---

## 6. REQUISITOS TÉCNICOS

### 6.1 Tecnología Backend
- **Lenguaje:** Python 3.11+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Validación:** Pydantic
- **Base de Datos:** MySQL 8.0+
- **Servidor:** Uvicorn

### 6.2 Tecnología Frontend
- **HTML5** + **CSS3** (Tailwind CDN)
- **JavaScript** Vanilla
- **Gráficas:** Chart.js
- **Responsive Design:** Mobile-first
- **Frameworks futuros:** React/Vue.js (Fase 3)

### 6.3 Infraestructura
- **Desarrollo:** Windows local
- **Producción:** Cloud (AWS/Azure/GCP) o servidor local
- **Base de Datos:** MySQL dedicado
- **Almacenamiento:** Archivos XML/PDF en filesystem o S3
- **Backup:** Automático programado

### 6.4 Integraciones
- **SAT:** Consulta de estatus UUID (simulado → real)
- **NetSuite:** Sincronización de catálogos (futuro)
- **Email:** Notificaciones automáticas (futuro)
- **MCP Servers:** Herramientas especializadas

### 6.5 Rendimiento
- **Validación:** 0.5 CFDIs/segundo mínimo
- **Dashboard:** Carga < 3 segundos
- **API:** Respuesta < 200ms promedio
- **Concurrencia:** Hasta 5 usuarios simultáneos (inicial)
- **Escalabilidad:** Preparado para 1000+ CFDIs/mes

---

## 7. ENTREGABLES

### 7.1 Fase 1 - POC (Actual)
✅ **COMPLETADO**
- Backend API funcional
- Dashboard web interactivo
- Chatbot terminal
- Validación automática de CFDIs
- Conciliación bancaria
- Sistema de reportes (6 tipos)
- Scripts de automatización
- Base de datos con datos de prueba
- Documentación técnica completa

### 7.2 Fase 2 - Producción (Próxima)
🔜 **PLANIFICADO - 8 semanas**
- Sistema de autenticación (login/logout)
- Roles y permisos
- Exportación a Excel/PDF
- Reportes programados
- Dashboard avanzado con filtros
- Gráficas adicionales
- Auditoría completa
- Optimización de rendimiento

### 7.3 Fase 3 - Avanzado (Futuro)
🔮 **ROADMAP - 12 semanas**
- Integración real con SAT
- Descarga masiva automática
- Machine Learning para predicción
- Portal de proveedores
- Mobile app (iOS/Android)
- Integración completa con NetSuite
- Despliegue en cloud
- Alta disponibilidad

---

## 8. MÉTRICAS DE ÉXITO

### 8.1 KPIs Operativos
| Métrica | Antes | Meta | Logrado |
|---------|-------|------|---------|
| Tiempo validación 100 CFDIs | 8-13 horas | < 30 min | ✅ 3.5 min |
| Tiempo conciliación mensual | 2-3 días | < 1 hora | ✅ 5 min |
| Errores de captura | 10-15% | < 2% | ✅ < 1% |
| Tiempo reportes | 2-4 horas | < 1 min | ✅ 5 seg |
| Disponibilidad de datos | 8x5 | 24x7 | ✅ 24x7 |

### 8.2 KPIs Técnicos
- **Uptime:** > 99% (futuro en cloud)
- **Tiempo de respuesta API:** < 200ms promedio
- **Tasa de éxito validación:** > 95%
- **Conciliación automática:** > 70%
- **Satisfacción de usuario:** > 8/10

### 8.3 ROI Esperado
- **Ahorro mensual:** $5,343.75 MXN
- **Ahorro anual:** $64,125 MXN
- **Payback period:** < 6 meses
- **Reducción de tiempo:** 95%
- **Reducción de errores:** 90%

---

## 9. RIESGOS Y MITIGACIONES

### R-001: Cambios en Regulación SAT
**Impacto:** Alto
**Probabilidad:** Media
**Mitigación:**
- Diseño modular para fácil actualización
- Monitoreo mensual de cambios SAT
- Pruebas regulares de validación

### R-002: Dependencia de Personal Técnico
**Impacto:** Alto
**Probabilidad:** Media
**Mitigación:**
- Documentación exhaustiva
- Capacitación de backup técnico
- Scripts de recuperación automática

### R-003: Crecimiento de Volumen
**Impacto:** Medio
**Probabilidad:** Alta
**Mitigación:**
- Arquitectura escalable implementada
- Plan de optimización (Fase 4)
- Procesamiento asíncrono (futuro)

### R-004: Pérdida de Datos
**Impacto:** Crítico
**Probabilidad:** Baja
**Mitigación:**
- Respaldos automáticos diarios
- Replicación de base de datos
- Plan de recuperación de desastres

---

## 10. CRITERIOS DE ACEPTACIÓN

### CA-001: Validación de CFDIs
- [ ] Sistema valida 100 CFDIs en menos de 5 minutos
- [ ] Tasa de éxito de validación > 95%
- [ ] Errores son descriptivos y accionables
- [ ] Validación contra SAT funciona (simulado/real)

### CA-002: Dashboard Web
- [ ] Dashboard carga en < 3 segundos
- [ ] Muestra al menos 8 KPIs configurables
- [ ] Incluye 4 gráficas interactivas
- [ ] Auto-refresh funciona correctamente
- [ ] Es responsive en móvil/tablet/desktop

### CA-003: Conciliación Bancaria
- [ ] Concilia automáticamente > 70% de movimientos
- [ ] Permite conciliación manual de excepciones
- [ ] Genera reporte de conciliación
- [ ] Identifica movimientos sin conciliar

### CA-004: Reportes
- [ ] Genera 6 tipos de reportes
- [ ] Reportes se generan en < 10 segundos
- [ ] Formato profesional apto para presentación
- [ ] Datos son consistentes con base de datos

### CA-005: API REST
- [ ] Documentación completa en /docs
- [ ] 25+ endpoints disponibles
- [ ] Tiempo de respuesta < 200ms promedio
- [ ] Manejo de errores robusto

### CA-006: Chatbot Terminal
- [ ] 7+ comandos especiales funcionan
- [ ] Responde consultas en lenguaje natural
- [ ] Respuestas en < 2 segundos
- [ ] Interfaz colorida en Windows

---

## 11. PLAN DE IMPLEMENTACIÓN

### Semana 0: Preparación
- ✅ Análisis de requerimientos
- ✅ Diseño de arquitectura
- ✅ Configuración de entorno
- ✅ Creación de base de datos

### Semanas 1-3: Desarrollo Core
- ✅ Backend API
- ✅ Modelos de base de datos
- ✅ Validación de CFDIs
- ✅ Conciliación bancaria

### Semanas 4-6: Frontend
- ✅ Dashboard web
- ✅ Gráficas interactivas
- ✅ Tabla dinámica
- ✅ Sistema de reportes

### Semanas 7-9: Integración y Pruebas
- ✅ Chatbot terminal
- ✅ Scripts de automatización
- ✅ Pruebas de integración
- ✅ Generación de datos de prueba
- ✅ Documentación técnica

### Semanas 10+: Próximas Fases
- 🔜 Autenticación y seguridad
- 🔜 Exportación avanzada
- 🔜 Dashboard avanzado
- 🔮 Integración SAT real
- 🔮 Despliegue en cloud

---

## 12. GLOSARIO

- **CFDI:** Comprobante Fiscal Digital por Internet
- **SAT:** Servicio de Administración Tributaria (México)
- **UUID:** Identificador Único Universal del CFDI
- **RFC:** Registro Federal de Contribuyentes
- **XML:** Formato de archivo del CFDI
- **PDF:** Representación impresa del CFDI
- **Dashboard:** Panel de control visual
- **KPI:** Key Performance Indicator (Indicador Clave)
- **API REST:** Interfaz de programación de aplicaciones
- **MCP:** Model Context Protocol (Herramientas especializadas)
- **POC:** Proof of Concept (Prueba de concepto)
- **ROI:** Return on Investment (Retorno de inversión)

---

## 13. ANEXOS

### Anexo A: Estructura de Base de Datos
Ver archivo: `database/schema_grupoabg.sql`

### Anexo B: Endpoints de API
Ver documentación: `http://localhost:8001/docs`

### Anexo C: Manual de Usuario
Ver archivo: `GUIA_USO_COMPLETA.md`

### Anexo D: Documentación Técnica
Ver archivo: `DOCUMENTACION_COMPLETA_SISTEMA_CFDI.pdf`

---

## CONTROL DE VERSIONES

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2025-12-14 | Equipo Técnico | Documento inicial consolidado |

---

**FIN DEL DOCUMENTO**

---

**IMPORTANTE:** Este documento consolida todos los requerimientos, reglas de negocio y especificaciones del Portal Dashboard para Validación de CFDIs de Grupo COLIMAN. Es el único documento de referencia para el desarrollo del sistema.
