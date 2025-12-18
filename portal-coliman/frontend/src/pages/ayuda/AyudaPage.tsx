import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import AdminLayout from '../../layouts/AdminLayout';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  order: number;
}

const AyudaPage: React.FC = () => {
  const { companyName } = useAppConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeBaseArticle[]>([]);

  // Base de conocimiento completa del sistema
  const knowledgeBase: KnowledgeBaseArticle[] = [
    {
      id: 'login',
      title: 'Inicio de Sesión',
      category: 'Autenticación',
      order: 1,
      tags: ['login', 'autenticación', 'acceso', 'contraseña'],
      content: `
        <h2>Inicio de Sesión en el Portal</h2>

        <h3>Requisitos Previos</h3>
        <ul>
          <li>Tener una cuenta de usuario activa</li>
          <li>Conocer su correo electrónico registrado</li>
          <li>Tener su contraseña a la mano</li>
        </ul>

        <h3>Pasos para Iniciar Sesión</h3>
        <ol>
          <li><strong>Acceder al Portal</strong>: Navegue a la URL del Portal</li>
          <li><strong>Ingresar Credenciales</strong>:
            <ul>
              <li>En el campo "Email", ingrese su correo electrónico registrado</li>
              <li>En el campo "Contraseña", ingrese su contraseña</li>
            </ul>
          </li>
          <li><strong>Hacer Click en "Iniciar Sesión"</strong></li>
          <li><strong>Esperar Validación</strong>: El sistema verificará sus credenciales</li>
          <li><strong>Redirección Automática</strong>: Si las credenciales son correctas, será redirigido al Dashboard</li>
        </ol>

        <h3>Roles de Usuario</h3>
        <p>El sistema maneja diferentes roles con distintos niveles de acceso:</p>
        <ul>
          <li><strong>Consulta</strong>: Acceso básico de lectura</li>
          <li><strong>Analista</strong>: Acceso a reportes y análisis</li>
          <li><strong>Contador</strong>: Acceso a funciones contables y catálogos</li>
          <li><strong>Admin</strong>: Acceso completo al sistema</li>
          <li><strong>Superadmin</strong>: Acceso total sin restricciones</li>
        </ul>

        <h3>Problemas Comunes</h3>
        <ul>
          <li><strong>Credenciales Incorrectas</strong>: Verifique que su email y contraseña sean correctos</li>
          <li><strong>Cuenta Bloqueada</strong>: Contacte al administrador si su cuenta está bloqueada</li>
          <li><strong>Olvidé mi Contraseña</strong>: Use la opción "¿Olvidaste tu contraseña?" en la página de login</li>
        </ul>
      `
    },
    {
      id: 'registro',
      title: 'Registro de Nueva Cuenta',
      category: 'Autenticación',
      order: 2,
      tags: ['registro', 'cuenta nueva', 'crear usuario'],
      content: `
        <h2>Registro de Nueva Cuenta</h2>

        <h3>Proceso de Registro</h3>
        <ol>
          <li><strong>Acceder a la Página de Registro</strong>: Click en "Crear cuenta" desde el login</li>
          <li><strong>Completar el Formulario</strong>:
            <ul>
              <li><strong>Nombre Completo</strong>: Ingrese su nombre y apellidos</li>
              <li><strong>Email</strong>: Debe ser un correo válido y único</li>
              <li><strong>Contraseña</strong>: Mínimo 8 caracteres</li>
              <li><strong>Confirmar Contraseña</strong>: Debe coincidir con la contraseña</li>
            </ul>
          </li>
          <li><strong>Hacer Click en "Registrarse"</strong></li>
          <li><strong>Verificación</strong>: El sistema validará la información</li>
          <li><strong>Asignación de Rol</strong>: Por defecto se asigna el rol "consulta"</li>
          <li><strong>Redirección</strong>: Será redirigido automáticamente al Dashboard</li>
        </ol>

        <h3>Requisitos de Contraseña</h3>
        <ul>
          <li>Mínimo 8 caracteres de longitud</li>
          <li>Se recomienda usar combinación de letras, números y símbolos</li>
        </ul>

        <h3>Nota Importante</h3>
        <p>El rol inicial asignado es "consulta". Para obtener permisos adicionales, contacte al administrador del sistema.</p>
      `
    },
    {
      id: 'dashboard',
      title: 'Panel de Control (Dashboard)',
      category: 'Navegación',
      order: 3,
      tags: ['dashboard', 'panel', 'inicio', 'kpis', 'resumen'],
      content: `
        <h2>Panel de Control (Dashboard)</h2>

        <h3>Descripción General</h3>
        <p>El Dashboard es la página principal del sistema donde se muestra un resumen ejecutivo de la información más relevante.</p>

        <h3>Componentes del Dashboard</h3>
        <ul>
          <li><strong>Tarjetas de KPIs</strong>: Indicadores clave de rendimiento
            <ul>
              <li>Total de CFDIs procesados</li>
              <li>Monto total de ingresos</li>
              <li>Monto total de egresos</li>
              <li>Número de proveedores activos</li>
            </ul>
          </li>
          <li><strong>Gráficos</strong>: Visualizaciones de datos importantes</li>
          <li><strong>Accesos Rápidos</strong>: Enlaces a las funciones más utilizadas</li>
          <li><strong>Notificaciones</strong>: Alertas y mensajes importantes</li>
        </ul>

        <h3>Navegación</h3>
        <p>Desde el Dashboard puede acceder a cualquier módulo del sistema usando el menú lateral izquierdo.</p>

        <h3>Personalización</h3>
        <p>Los KPIs y gráficos se actualizan en tiempo real según los datos de su empresa.</p>
      `
    },
    {
      id: 'cfdis-lista',
      title: 'Lista de CFDIs',
      category: 'CFDIs',
      order: 4,
      tags: ['cfdi', 'lista', 'comprobantes', 'facturas'],
      content: `
        <h2>Gestión de CFDIs</h2>

        <h3>¿Qué es un CFDI?</h3>
        <p>CFDI (Comprobante Fiscal Digital por Internet) es la factura electrónica válida en México según las normas del SAT.</p>

        <h3>Acceder a la Lista de CFDIs</h3>
        <ol>
          <li>En el menú lateral, click en "CFDIs"</li>
          <li>Verá una tabla con todos los comprobantes registrados</li>
        </ol>

        <h3>Información Mostrada</h3>
        <p>La tabla de CFDIs muestra:</p>
        <ul>
          <li><strong>UUID</strong>: Folio fiscal único del comprobante</li>
          <li><strong>Fecha</strong>: Fecha de emisión del CFDI</li>
          <li><strong>Emisor</strong>: RFC y nombre del emisor</li>
          <li><strong>Receptor</strong>: RFC y nombre del receptor</li>
          <li><strong>Monto Total</strong>: Importe total del comprobante</li>
          <li><strong>Tipo</strong>: I (Ingreso), E (Egreso), T (Traslado), etc.</li>
          <li><strong>Estado SAT</strong>: Vigente, Cancelado</li>
          <li><strong>Estatus Validación</strong>: Pendiente, Válido, Rechazado</li>
        </ul>

        <h3>Funciones Disponibles</h3>
        <ul>
          <li><strong>Ver Detalle</strong>: Click en el icono de ojo para ver detalles completos</li>
          <li><strong>Validar CFDI</strong>: Verifica el comprobante contra el SAT</li>
          <li><strong>Descargar XML</strong>: Descarga el archivo XML original</li>
          <li><strong>Buscar</strong>: Use el campo de búsqueda para filtrar CFDIs</li>
          <li><strong>Filtrar</strong>: Filtros por fecha, emisor, receptor, etc.</li>
          <li><strong>Ordenar</strong>: Click en los encabezados de columna para ordenar</li>
        </ul>

        <h3>Paginación</h3>
        <p>La tabla muestra 10 registros por página. Use los controles de paginación en la parte inferior para navegar.</p>
      `
    },
    {
      id: 'cfdi-detalle',
      title: 'Detalle de CFDI',
      category: 'CFDIs',
      order: 5,
      tags: ['cfdi', 'detalle', 'información', 'xml'],
      content: `
        <h2>Detalle de CFDI</h2>

        <h3>Acceder al Detalle</h3>
        <ol>
          <li>En la lista de CFDIs, click en el icono de ojo (👁️) en la fila del CFDI</li>
          <li>Se abrirá la página de detalle completo</li>
        </ol>

        <h3>Secciones de Información</h3>

        <h4>1. Información General</h4>
        <ul>
          <li>UUID (Folio Fiscal)</li>
          <li>Serie y Folio</li>
          <li>Fecha y hora de emisión</li>
          <li>Tipo de comprobante</li>
          <li>Método y forma de pago</li>
          <li>Lugar de expedición</li>
        </ul>

        <h4>2. Emisor</h4>
        <ul>
          <li>RFC del emisor</li>
          <li>Nombre o razón social</li>
          <li>Régimen fiscal</li>
        </ul>

        <h4>3. Receptor</h4>
        <ul>
          <li>RFC del receptor</li>
          <li>Nombre o razón social</li>
          <li>Régimen fiscal</li>
          <li>Uso del CFDI</li>
        </ul>

        <h4>4. Conceptos</h4>
        <p>Lista detallada de productos o servicios:</p>
        <ul>
          <li>Clave de producto/servicio</li>
          <li>Cantidad</li>
          <li>Unidad</li>
          <li>Descripción</li>
          <li>Precio unitario</li>
          <li>Importe</li>
          <li>Impuestos aplicados</li>
        </ul>

        <h4>5. Totales</h4>
        <ul>
          <li>Subtotal</li>
          <li>Descuentos</li>
          <li>Impuestos trasladados (IVA, IEPS, etc.)</li>
          <li>Impuestos retenidos</li>
          <li>Total</li>
        </ul>

        <h4>6. Timbre Fiscal Digital</h4>
        <ul>
          <li>UUID</li>
          <li>Fecha de timbrado</li>
          <li>RFC del proveedor de certificación (PAC)</li>
          <li>Sello digital del CFDI</li>
          <li>Sello del SAT</li>
        </ul>

        <h3>Acciones Disponibles</h3>
        <ul>
          <li><strong>Validar en SAT</strong>: Verifica el estado actual del CFDI</li>
          <li><strong>Descargar XML</strong>: Descarga el archivo XML original</li>
          <li><strong>Ver XML</strong>: Visualiza el contenido XML en formato legible</li>
          <li><strong>Imprimir</strong>: Genera una representación impresa del CFDI</li>
        </ul>
      `
    },
    {
      id: 'cfdi-validacion',
      title: 'Validación de CFDIs con el SAT',
      category: 'CFDIs',
      order: 6,
      tags: ['validación', 'sat', 'verificar', 'vigente'],
      content: `
        <h2>Validación de CFDIs con el SAT</h2>

        <h3>¿Qué es la Validación?</h3>
        <p>La validación verifica el estado actual de un CFDI directamente con el Servicio de Administración Tributaria (SAT).</p>

        <h3>Estados Posibles</h3>
        <ul>
          <li><strong>Vigente</strong>: El CFDI es válido y está activo</li>
          <li><strong>Cancelado</strong>: El CFDI fue cancelado por el emisor</li>
          <li><strong>No Encontrado</strong>: El UUID no existe en los registros del SAT</li>
        </ul>

        <h3>Cómo Validar un CFDI</h3>
        <ol>
          <li>Abra el detalle del CFDI que desea validar</li>
          <li>Click en el botón "Validar en SAT"</li>
          <li>El sistema consultará al web service del SAT</li>
          <li>Se mostrará el resultado de la validación</li>
          <li>La información se guardará en el sistema</li>
        </ol>

        <h3>Información de Validación</h3>
        <p>El sistema guarda:</p>
        <ul>
          <li>Fecha y hora de la última validación</li>
          <li>Estado del comprobante según el SAT</li>
          <li>Estado de cancelabilidad</li>
          <li>Respuesta completa del SAT en formato JSON</li>
        </ul>

        <h3>Validación Masiva</h3>
        <p>Próximamente estará disponible la función de validación masiva para verificar múltiples CFDIs simultáneamente.</p>

        <h3>Notas Importantes</h3>
        <ul>
          <li>La validación requiere conexión a internet</li>
          <li>El servicio del SAT puede tener periodos de mantenimiento</li>
          <li>Se recomienda validar periódicamente los CFDIs importantes</li>
          <li>La validación no modifica el CFDI, solo verifica su estado</li>
        </ul>
      `
    },
    {
      id: 'descarga-masiva-sat',
      title: 'Descarga Masiva del SAT',
      category: 'CFDIs',
      order: 7,
      tags: ['descarga masiva', 'sat', 'fiel', 'cfdi'],
      content: `
        <h2>Descarga Masiva del SAT</h2>

        <h3>¿Qué es la Descarga Masiva?</h3>
        <p>Es un servicio del SAT que permite descargar todos los CFDIs emitidos y recibidos en un periodo específico.</p>

        <h3>Requisitos</h3>
        <ul>
          <li><strong>FIEL Vigente</strong>: Firma Electrónica Avanzada del SAT</li>
          <li><strong>Archivos Necesarios</strong>:
            <ul>
              <li>Certificado (.cer)</li>
              <li>Llave privada (.key)</li>
              <li>Contraseña de la llave privada</li>
            </ul>
          </li>
        </ul>

        <h3>Proceso de Descarga</h3>
        <ol>
          <li><strong>Autenticación</strong>:
            <ul>
              <li>Subir archivo .cer (certificado)</li>
              <li>Subir archivo .key (llave privada)</li>
              <li>Ingresar contraseña de la FIEL</li>
              <li>Click en "Autenticar"</li>
            </ul>
          </li>
          <li><strong>Solicitar Descarga</strong>:
            <ul>
              <li>Seleccionar rango de fechas (máximo 1 mes)</li>
              <li>Elegir tipo: CFDIs Emitidos o Recibidos</li>
              <li>Opcionalmente filtrar por RFC receptor/emisor</li>
              <li>Click en "Solicitar Descarga"</li>
            </ul>
          </li>
          <li><strong>Verificar Estado</strong>:
            <ul>
              <li>El SAT procesa la solicitud de forma asíncrona</li>
              <li>Puede tomar desde minutos hasta horas</li>
              <li>Verificar periódicamente el estado</li>
            </ul>
          </li>
          <li><strong>Descargar Paquetes</strong>:
            <ul>
              <li>Cuando el estado sea "Terminada"</li>
              <li>Descargar los paquetes ZIP generados</li>
              <li>Extraer y procesar los XMLs</li>
            </ul>
          </li>
        </ol>

        <h3>Limitaciones</h3>
        <ul>
          <li>Máximo 5 años fiscales + año actual</li>
          <li>Hasta 5 RFCs receptores por solicitud (v1.5)</li>
          <li>No hay ambiente de pruebas, solo producción</li>
          <li>El procesamiento es asíncrono</li>
        </ul>

        <h3>Estado de Implementación</h3>
        <p><strong>⚠️ Actualmente en desarrollo</strong></p>
        <p>Pendiente de implementar:</p>
        <ul>
          <li>Conversión de certificados FIEL (DER a PEM)</li>
          <li>Firma digital XMLDSig</li>
          <li>Manejo de SOAP con WS-Security</li>
        </ul>

        <h3>Referencias</h3>
        <ul>
          <li><a href="https://github.com/phpcfdi/sat-ws-descarga-masiva" target="_blank">Librería PHP recomendada</a></li>
          <li><a href="https://developers.sw.com.mx/knowledge-base/consumo-webservice-descarga-masiva-sat/" target="_blank">Documentación SW Sapien</a></li>
        </ul>
      `
    },
    {
      id: 'reportes',
      title: 'Reportes del Sistema',
      category: 'Reportes',
      order: 8,
      tags: ['reportes', 'pdf', 'excel', 'exportar'],
      content: `
        <h2>Sistema de Reportes</h2>

        <h3>Tipos de Reportes Disponibles</h3>

        <h4>1. Reporte de Ingresos y Egresos</h4>
        <p>Análisis detallado de entradas y salidas financieras</p>
        <ul>
          <li>Filtrado por rango de fechas</li>
          <li>Agrupación por periodo (día, mes, año)</li>
          <li>Totales y subtotales</li>
          <li>Gráficos comparativos</li>
        </ul>

        <h4>2. Reporte Ejecutivo</h4>
        <p>Resumen ejecutivo con KPIs principales</p>
        <ul>
          <li>Indicadores clave de rendimiento</li>
          <li>Tendencias y proyecciones</li>
          <li>Comparativas periodo anterior</li>
          <li>Alertas y recomendaciones</li>
        </ul>

        <h4>3. Reporte de Conciliación</h4>
        <p>Conciliación bancaria y movimientos</p>
        <ul>
          <li>Comparación con estados de cuenta</li>
          <li>Identificación de diferencias</li>
          <li>Movimientos pendientes de conciliar</li>
        </ul>

        <h3>Formatos de Exportación</h3>
        <ul>
          <li><strong>PDF</strong>: Formato de impresión y archivo</li>
          <li><strong>Excel (XLSX)</strong>: Para análisis adicional</li>
          <li><strong>CSV</strong>: Para importar a otros sistemas</li>
          <li><strong>JSON</strong>: Para integraciones API</li>
        </ul>

        <h3>Cómo Generar un Reporte</h3>
        <ol>
          <li>Ir al menú "Reportes"</li>
          <li>Seleccionar el tipo de reporte deseado</li>
          <li>Configurar filtros y parámetros</li>
          <li>Elegir formato de exportación</li>
          <li>Click en "Generar Reporte"</li>
          <li>Esperar procesamiento</li>
          <li>Descargar archivo generado</li>
        </ol>

        <h3>Programación de Reportes</h3>
        <p>Próximamente podrá programar reportes automáticos:</p>
        <ul>
          <li>Frecuencia: Diaria, Semanal, Mensual</li>
          <li>Envío automático por email</li>
          <li>Múltiples destinatarios</li>
        </ul>

        <h3>Historial de Reportes</h3>
        <p>Los reportes generados se guardan en el historial para consulta posterior durante 90 días.</p>
      `
    },
    {
      id: 'kpis',
      title: 'Indicadores KPIs',
      category: 'Análisis',
      order: 9,
      tags: ['kpis', 'indicadores', 'métricas', 'rendimiento'],
      content: `
        <h2>Indicadores KPIs</h2>

        <h3>¿Qué son los KPIs?</h3>
        <p>KPI (Key Performance Indicator) son indicadores clave que miden el rendimiento y salud financiera de la empresa.</p>

        <h3>KPIs Disponibles</h3>

        <h4>KPIs Financieros</h4>
        <ul>
          <li><strong>Total de Ingresos</strong>: Suma de todos los CFDIs de ingreso</li>
          <li><strong>Total de Egresos</strong>: Suma de todos los CFDIs de egreso</li>
          <li><strong>Margen de Utilidad</strong>: (Ingresos - Egresos) / Ingresos * 100</li>
          <li><strong>Flujo de Efectivo</strong>: Entradas menos salidas</li>
        </ul>

        <h4>KPIs Operativos</h4>
        <ul>
          <li><strong>Total de CFDIs</strong>: Cantidad de comprobantes procesados</li>
          <li><strong>CFDIs Validados</strong>: Porcentaje de CFDIs verificados con el SAT</li>
          <li><strong>CFDIs Cancelados</strong>: Cantidad de comprobantes cancelados</li>
          <li><strong>Tiempo Promedio de Validación</strong>: Eficiencia del proceso</li>
        </ul>

        <h4>KPIs de Clientes/Proveedores</h4>
        <ul>
          <li><strong>Número de Proveedores Activos</strong></li>
          <li><strong>Número de Clientes Activos</strong></li>
          <li><strong>Ticket Promedio</strong>: Monto promedio por transacción</li>
          <li><strong>Top 10 Clientes</strong>: Por volumen de facturación</li>
          <li><strong>Top 10 Proveedores</strong>: Por volumen de compras</li>
        </ul>

        <h3>Visualizaciones</h3>
        <p>Los KPIs se presentan mediante:</p>
        <ul>
          <li><strong>Tarjetas con Iconos</strong>: Vista rápida de valores principales</li>
          <li><strong>Gráficos de Tendencia</strong>: Evolución en el tiempo</li>
          <li><strong>Gráficos Comparativos</strong>: Comparación entre periodos</li>
          <li><strong>Indicadores de Cambio</strong>: Aumentos/disminuciones porcentuales</li>
        </ul>

        <h3>Filtros Disponibles</h3>
        <ul>
          <li>Rango de fechas personalizado</li>
          <li>Periodo predefinido (Hoy, Esta semana, Este mes, Este año)</li>
          <li>Por tipo de comprobante</li>
          <li>Por emisor/receptor específico</li>
        </ul>

        <h3>Actualización de Datos</h3>
        <p>Los KPIs se actualizan en tiempo real según los datos en el sistema. Use el botón de actualización para obtener los valores más recientes.</p>
      `
    },
    {
      id: 'graficas',
      title: 'Gráficas y Visualizaciones',
      category: 'Análisis',
      order: 10,
      tags: ['gráficas', 'charts', 'visualización', 'análisis'],
      content: `
        <h2>Gráficas y Visualizaciones</h2>

        <h3>Tipos de Gráficas Disponibles</h3>

        <h4>1. Gráfica de Barras</h4>
        <p>Comparación de valores entre categorías</p>
        <ul>
          <li>Ingresos vs Egresos por periodo</li>
          <li>Volumen de CFDIs por mes</li>
          <li>Top proveedores/clientes</li>
        </ul>

        <h4>2. Gráfica de Líneas</h4>
        <p>Tendencias y evolución en el tiempo</p>
        <ul>
          <li>Flujo de efectivo mensual</li>
          <li>Evolución de ingresos</li>
          <li>Crecimiento año con año</li>
        </ul>

        <h4>3. Gráfica de Pastel (Pie Chart)</h4>
        <p>Distribución porcentual</p>
        <ul>
          <li>Distribución de gastos por categoría</li>
          <li>Tipos de comprobantes</li>
          <li>Participación de clientes</li>
        </ul>

        <h4>4. Gráfica de Área</h4>
        <p>Acumulados y tendencias</p>
        <ul>
          <li>Ingresos acumulados</li>
          <li>Comparativa año anterior</li>
        </ul>

        <h3>Interactividad</h3>
        <p>Las gráficas son interactivas:</p>
        <ul>
          <li><strong>Hover</strong>: Pase el mouse sobre elementos para ver detalles</li>
          <li><strong>Click en Leyenda</strong>: Ocultar/mostrar series de datos</li>
          <li><strong>Zoom</strong>: Acercar zonas específicas (según el tipo de gráfica)</li>
          <li><strong>Exportar</strong>: Descargar gráfica como imagen PNG</li>
        </ul>

        <h3>Personalización</h3>
        <ul>
          <li>Seleccionar rango de fechas</li>
          <li>Filtrar por categorías</li>
          <li>Cambiar agrupación (día, semana, mes, año)</li>
          <li>Elegir métricas a visualizar</li>
        </ul>

        <h3>Dashboard de Gráficas</h3>
        <p>El módulo de gráficas permite:</p>
        <ul>
          <li>Ver múltiples visualizaciones simultáneamente</li>
          <li>Personalizar el layout</li>
          <li>Guardar configuraciones favoritas</li>
          <li>Exportar reportes visuales en PDF</li>
        </ul>
      `
    },
    {
      id: 'configuracion',
      title: 'Configuración del Sistema',
      category: 'Configuración',
      order: 11,
      tags: ['configuración', 'ajustes', 'settings', 'admin'],
      content: `
        <h2>Configuración del Sistema</h2>

        <p><strong>Nota:</strong> Este módulo solo está disponible para usuarios con rol de Administrador.</p>

        <h3>Secciones de Configuración</h3>

        <h4>1. Constancia Fiscal</h4>
        <p>Configuración de información fiscal de la empresa:</p>
        <ul>
          <li>RFC de la empresa</li>
          <li>Razón social</li>
          <li>Régimen fiscal</li>
          <li>Domicilio fiscal</li>
          <li>Certificados SAT</li>
        </ul>

        <h4>2. Correo Electrónico</h4>
        <p>Configuración del servidor SMTP para envío de emails:</p>
        <ul>
          <li>Servidor SMTP (host y puerto)</li>
          <li>Usuario y contraseña</li>
          <li>Email remitente predeterminado</li>
          <li>Configuración de seguridad (TLS/SSL)</li>
          <li>Plantillas de correo</li>
        </ul>

        <h4>3. Carpetas</h4>
        <p>Gestión de carpetas para almacenamiento de archivos:</p>
        <ul>
          <li>Ruta de almacenamiento de XMLs</li>
          <li>Ruta de almacenamiento de PDFs</li>
          <li>Ruta de backups</li>
          <li>Ruta de archivos temporales</li>
          <li>Permisos de carpetas</li>
        </ul>

        <h4>4. Plantillas y Temas</h4>
        <p>Personalización visual del sistema:</p>
        <ul>
          <li>Logo de la empresa</li>
          <li>Colores corporativos</li>
          <li>Plantillas de reportes</li>
          <li>Plantillas de facturas</li>
        </ul>

        <h4>5. Conexión MCP</h4>
        <p>Configuración de Model Context Protocol para IA:</p>
        <ul>
          <li>Endpoints de conexión</li>
          <li>Credenciales de API</li>
          <li>Configuración de contexto</li>
          <li>Límites de uso</li>
        </ul>

        <h4>6. Configuración IA</h4>
        <p>Ajustes de inteligencia artificial:</p>
        <ul>
          <li>Modelo de IA a utilizar</li>
          <li>Parámetros de generación</li>
          <li>Configuración de prompts</li>
          <li>Límites de tokens</li>
        </ul>

        <h3>Seguridad</h3>
        <p>Todas las configuraciones sensibles (contraseñas, API keys) se almacenan encriptadas en la base de datos.</p>

        <h3>Backup de Configuración</h3>
        <p>Se recomienda exportar la configuración regularmente como respaldo.</p>
      `
    },
    {
      id: 'catalogos',
      title: 'Catálogos del Sistema',
      category: 'Catálogos',
      order: 12,
      tags: ['catálogos', 'clientes', 'proveedores', 'usuarios'],
      content: `
        <h2>Catálogos del Sistema</h2>

        <h3>¿Qué son los Catálogos?</h3>
        <p>Los catálogos son listados maestros de información fundamental para el sistema.</p>

        <h3>Catálogos Disponibles</h3>

        <h4>1. Catálogo de Clientes</h4>
        <p><strong>Rol requerido:</strong> Contador o superior</p>
        <p>Gestión de clientes de la empresa:</p>
        <ul>
          <li><strong>Información Básica</strong>:
            <ul>
              <li>RFC</li>
              <li>Razón social o nombre</li>
              <li>Régimen fiscal</li>
              <li>Código postal</li>
            </ul>
          </li>
          <li><strong>Datos de Contacto</strong>:
            <ul>
              <li>Email</li>
              <li>Teléfono</li>
              <li>Dirección completa</li>
            </ul>
          </li>
          <li><strong>Configuración</strong>:
            <ul>
              <li>Uso de CFDI predeterminado</li>
              <li>Forma de pago preferida</li>
              <li>Condiciones comerciales</li>
            </ul>
          </li>
        </ul>

        <h4>2. Catálogo de Proveedores</h4>
        <p><strong>Rol requerido:</strong> Contador o superior</p>
        <p>Gestión de proveedores:</p>
        <ul>
          <li>Información similar a clientes</li>
          <li>Categorización por tipo de servicio/producto</li>
          <li>Datos bancarios para pagos</li>
          <li>Contactos clave</li>
        </ul>

        <h4>3. Catálogo de Usuarios</h4>
        <p><strong>Rol requerido:</strong> Administrador</p>
        <p>Gestión de usuarios del sistema:</p>
        <ul>
          <li><strong>Datos del Usuario</strong>:
            <ul>
              <li>Nombre completo</li>
              <li>Email (usado como usuario)</li>
              <li>Contraseña</li>
            </ul>
          </li>
          <li><strong>Permisos</strong>:
            <ul>
              <li>Rol asignado</li>
              <li>Módulos accesibles</li>
              <li>Permisos especiales</li>
            </ul>
          </li>
          <li><strong>Estado</strong>:
            <ul>
              <li>Activo/Inactivo</li>
              <li>Fecha de último acceso</li>
              <li>Historial de actividad</li>
            </ul>
          </li>
        </ul>

        <h3>Funciones Comunes</h3>
        <p>Todos los catálogos permiten:</p>
        <ul>
          <li><strong>Crear</strong>: Agregar nuevos registros</li>
          <li><strong>Editar</strong>: Modificar información existente</li>
          <li><strong>Eliminar</strong>: Borrar registros (con confirmación)</li>
          <li><strong>Buscar</strong>: Filtrar por diferentes campos</li>
          <li><strong>Exportar</strong>: Descargar listado en Excel/CSV</li>
          <li><strong>Importar</strong>: Carga masiva desde archivo</li>
        </ul>

        <h3>Validaciones</h3>
        <p>El sistema valida automáticamente:</p>
        <ul>
          <li>RFC con formato correcto y dígito verificador</li>
          <li>Emails con formato válido</li>
          <li>Códigos postales existentes</li>
          <li>Duplicados (no permite RFCs duplicados)</li>
        </ul>
      `
    },
    {
      id: 'roles-permisos',
      title: 'Roles y Permisos',
      category: 'Seguridad',
      order: 13,
      tags: ['roles', 'permisos', 'seguridad', 'acceso'],
      content: `
        <h2>Roles y Permisos del Sistema</h2>

        <h3>Jerarquía de Roles</h3>
        <p>El sistema maneja 5 niveles de roles con permisos crecientes:</p>

        <h4>1. Consulta (Nivel 1)</h4>
        <p>Acceso básico de solo lectura:</p>
        <ul>
          <li>✅ Ver Dashboard</li>
          <li>✅ Ver lista de CFDIs</li>
          <li>✅ Ver detalle de CFDIs</li>
          <li>✅ Ver KPIs básicos</li>
          <li>✅ Ver gráficas</li>
          <li>❌ No puede modificar datos</li>
          <li>❌ No puede generar reportes</li>
          <li>❌ No accede a configuración</li>
        </ul>

        <h4>2. Analista (Nivel 2)</h4>
        <p>Incluye todo lo de Consulta, más:</p>
        <ul>
          <li>✅ Generar reportes</li>
          <li>✅ Exportar datos</li>
          <li>✅ Ver reportes avanzados</li>
          <li>✅ Análisis de KPIs avanzados</li>
          <li>❌ No puede modificar CFDIs</li>
          <li>❌ No accede a catálogos</li>
        </ul>

        <h4>3. Contador (Nivel 3)</h4>
        <p>Incluye todo lo de Analista, más:</p>
        <ul>
          <li>✅ Validar CFDIs con SAT</li>
          <li>✅ Gestionar catálogo de clientes</li>
          <li>✅ Gestionar catálogo de proveedores</li>
          <li>✅ Generar reportes fiscales</li>
          <li>✅ Conciliación bancaria</li>
          <li>❌ No puede modificar configuración del sistema</li>
        </ul>

        <h4>4. Admin (Nivel 4)</h4>
        <p>Incluye todo lo de Contador, más:</p>
        <ul>
          <li>✅ Acceso completo a configuración</li>
          <li>✅ Gestionar usuarios</li>
          <li>✅ Asignar roles y permisos</li>
          <li>✅ Descarga masiva SAT</li>
          <li>✅ Ver reportes ejecutivos</li>
          <li>✅ Modificar configuración de IA</li>
        </ul>

        <h4>5. Superadmin (Nivel 5)</h4>
        <p>Acceso total sin restricciones:</p>
        <ul>
          <li>✅ Todos los permisos de Admin</li>
          <li>✅ Acceso a logs del sistema</li>
          <li>✅ Modificar base de datos directamente</li>
          <li>✅ Eliminar cualquier registro</li>
          <li>✅ Configuración avanzada del servidor</li>
        </ul>

        <h3>Asignación de Roles</h3>
        <p>Solo usuarios con rol Admin o superior pueden asignar roles a otros usuarios.</p>

        <h3>Seguridad</h3>
        <ul>
          <li>Los permisos se verifican en cada solicitud al servidor</li>
          <li>Intentos de acceso no autorizado se registran en logs</li>
          <li>El sistema valida tanto en frontend como en backend</li>
        </ul>

        <h3>Cambio de Rol</h3>
        <p>Para cambiar el rol de un usuario:</p>
        <ol>
          <li>Ir a Catálogos → Usuarios (requiere rol Admin)</li>
          <li>Buscar el usuario a modificar</li>
          <li>Click en editar</li>
          <li>Seleccionar nuevo rol</li>
          <li>Guardar cambios</li>
          <li>El usuario deberá cerrar sesión y volver a iniciar para que los cambios surtan efecto</li>
        </ol>
      `
    },
    {
      id: 'arquitectura-sistema',
      title: 'Arquitectura del Sistema',
      category: 'Técnico',
      order: 14,
      tags: ['arquitectura', 'tecnología', 'stack', 'técnico'],
      content: `
        <h2>Arquitectura del Sistema</h2>

        <h3>Stack Tecnológico</h3>

        <h4>Frontend</h4>
        <ul>
          <li><strong>React 18</strong>: Biblioteca JavaScript para interfaces de usuario</li>
          <li><strong>TypeScript</strong>: Tipado estático para JavaScript</li>
          <li><strong>Material-UI (MUI)</strong>: Biblioteca de componentes UI</li>
          <li><strong>React Router</strong>: Enrutamiento del lado del cliente</li>
          <li><strong>TanStack Query (React Query)</strong>: Gestión de estado del servidor</li>
          <li><strong>Axios</strong>: Cliente HTTP para APIs</li>
          <li><strong>Recharts</strong>: Biblioteca de gráficas</li>
          <li><strong>Day.js</strong>: Manejo de fechas</li>
        </ul>

        <h4>Backend</h4>
        <ul>
          <li><strong>FastAPI</strong>: Framework web Python moderno y rápido</li>
          <li><strong>Uvicorn</strong>: Servidor ASGI de alto rendimiento</li>
          <li><strong>SQLAlchemy 2.0</strong>: ORM para Python</li>
          <li><strong>PyMySQL</strong>: Conector MySQL para Python</li>
          <li><strong>Pydantic</strong>: Validación de datos</li>
          <li><strong>Python-JOSE</strong>: JWT para autenticación</li>
          <li><strong>Passlib</strong>: Hash de contraseñas</li>
          <li><strong>lxml</strong>: Procesamiento XML</li>
          <li><strong>requests</strong>: Cliente HTTP Python</li>
        </ul>

        <h4>Base de Datos</h4>
        <ul>
          <li><strong>MySQL 8.0</strong>: Sistema de gestión de bases de datos relacional</li>
          <li><strong>Alembic</strong>: Migraciones de base de datos</li>
        </ul>

        <h4>Infraestructura</h4>
        <ul>
          <li><strong>Docker</strong>: Contenedorización</li>
          <li><strong>Docker Compose</strong>: Orquestación de contenedores</li>
        </ul>

        <h3>Arquitectura de Tres Capas</h3>

        <h4>Capa de Presentación (Frontend)</h4>
        <p>React SPA (Single Page Application) que se ejecuta en el navegador del usuario.</p>

        <h4>Capa de Lógica de Negocio (Backend API)</h4>
        <p>API RESTful construida con FastAPI que maneja:</p>
        <ul>
          <li>Autenticación y autorización</li>
          <li>Validación de datos</li>
          <li>Lógica de negocio</li>
          <li>Integración con servicios externos (SAT)</li>
        </ul>

        <h4>Capa de Datos</h4>
        <p>MySQL como base de datos relacional con:</p>
        <ul>
          <li>Tablas normalizadas</li>
          <li>Índices para optimización</li>
          <li>Procedimientos almacenados (donde aplique)</li>
        </ul>

        <h3>Flujo de Datos</h3>
        <ol>
          <li><strong>Usuario</strong> interactúa con la interfaz React</li>
          <li><strong>Frontend</strong> envía peticiones HTTP a la API</li>
          <li><strong>Backend</strong> valida la petición y autenticación</li>
          <li><strong>Backend</strong> procesa la lógica de negocio</li>
          <li><strong>Backend</strong> consulta/modifica la base de datos</li>
          <li><strong>Backend</strong> retorna respuesta JSON</li>
          <li><strong>Frontend</strong> actualiza la interfaz</li>
        </ol>

        <h3>Seguridad</h3>
        <ul>
          <li><strong>JWT</strong>: Tokens para autenticación stateless</li>
          <li><strong>CORS</strong>: Configurado para permitir solo orígenes autorizados</li>
          <li><strong>HTTPS</strong>: Comunicación encriptada (en producción)</li>
          <li><strong>Bcrypt</strong>: Hash seguro de contraseñas</li>
          <li><strong>Validación</strong>: En frontend y backend</li>
        </ul>

        <h3>Escalabilidad</h3>
        <p>La arquitectura permite escalar horizontalmente:</p>
        <ul>
          <li>Frontend: Servido desde CDN</li>
          <li>Backend: Múltiples instancias detrás de load balancer</li>
          <li>Base de datos: Replicación master-slave</li>
        </ul>
      `
    },
    {
      id: 'api-endpoints',
      title: 'Endpoints de la API',
      category: 'Técnico',
      order: 15,
      tags: ['api', 'endpoints', 'rest', 'técnico'],
      content: `
        <h2>Endpoints de la API</h2>

        <h3>URL Base</h3>
        <p><code>http://localhost:8000</code> (desarrollo)</p>

        <h3>Autenticación</h3>
        <p><strong>Prefix:</strong> <code>/api/auth</code></p>
        <ul>
          <li><code>POST /api/auth/register</code> - Registrar nuevo usuario</li>
          <li><code>POST /api/auth/login</code> - Iniciar sesión</li>
          <li><code>GET /api/auth/me</code> - Obtener usuario actual (requiere token)</li>
        </ul>

        <h3>CFDIs</h3>
        <p><strong>Prefix:</strong> <code>/api/cfdis</code></p>
        <ul>
          <li><code>GET /api/cfdis/list</code> - Listar CFDIs (paginado)</li>
          <li><code>GET /api/cfdis/{id}</code> - Obtener detalle de CFDI</li>
          <li><code>POST /api/cfdis/validate</code> - Validar CFDI con SAT</li>
          <li><code>POST /api/cfdis/upload</code> - Subir archivo XML</li>
          <li><code>GET /api/cfdis/{id}/xml</code> - Descargar XML original</li>
          <li><code>DELETE /api/cfdis/{id}</code> - Eliminar CFDI</li>
        </ul>

        <h3>Descarga Masiva SAT</h3>
        <p><strong>Prefix:</strong> <code>/api/sat-descarga-masiva</code></p>
        <ul>
          <li><code>GET /api/sat-descarga-masiva/info</code> - Información del servicio</li>
          <li><code>POST /api/sat-descarga-masiva/autenticar</code> - Autenticar con FIEL</li>
          <li><code>POST /api/sat-descarga-masiva/solicitar</code> - Solicitar descarga</li>
          <li><code>POST /api/sat-descarga-masiva/verificar</code> - Verificar estado de solicitud</li>
          <li><code>POST /api/sat-descarga-masiva/descargar-paquete</code> - Descargar paquete</li>
        </ul>

        <h3>Reportes (Próximamente)</h3>
        <p><strong>Prefix:</strong> <code>/api/reportes</code></p>
        <ul>
          <li><code>POST /api/reportes/ingresos-egresos</code> - Generar reporte de ingresos/egresos</li>
          <li><code>POST /api/reportes/ejecutivo</code> - Generar reporte ejecutivo</li>
          <li><code>POST /api/reportes/conciliacion</code> - Generar reporte de conciliación</li>
          <li><code>GET /api/reportes/historial</code> - Listar reportes generados</li>
        </ul>

        <h3>KPIs (Próximamente)</h3>
        <p><strong>Prefix:</strong> <code>/api/kpis</code></p>
        <ul>
          <li><code>GET /api/kpis/financieros</code> - Obtener KPIs financieros</li>
          <li><code>GET /api/kpis/operativos</code> - Obtener KPIs operativos</li>
          <li><code>GET /api/kpis/clientes-proveedores</code> - Obtener KPIs de clientes/proveedores</li>
        </ul>

        <h3>Catálogos (Próximamente)</h3>
        <p><strong>Prefix:</strong> <code>/api/catalogos</code></p>
        <ul>
          <li><code>GET /api/catalogos/clientes</code> - Listar clientes</li>
          <li><code>POST /api/catalogos/clientes</code> - Crear cliente</li>
          <li><code>PUT /api/catalogos/clientes/{id}</code> - Actualizar cliente</li>
          <li><code>DELETE /api/catalogos/clientes/{id}</code> - Eliminar cliente</li>
          <li><em>Endpoints similares para proveedores y usuarios</em></li>
        </ul>

        <h3>Formato de Respuestas</h3>

        <h4>Respuesta Exitosa</h4>
        <pre><code>{
  "status": "success",
  "data": { ... },
  "message": "Operación exitosa"
}</code></pre>

        <h4>Respuesta de Error</h4>
        <pre><code>{
  "detail": "Descripción del error",
  "status_code": 400
}</code></pre>

        <h3>Autenticación</h3>
        <p>La mayoría de endpoints requieren token JWT en el header:</p>
        <pre><code>Authorization: Bearer {token}</code></pre>

        <h3>Paginación</h3>
        <p>Endpoints de listado aceptan parámetros:</p>
        <ul>
          <li><code>skip</code>: Número de registros a omitir (default: 0)</li>
          <li><code>limit</code>: Número de registros a retornar (default: 10, max: 100)</li>
        </ul>

        <h3>Documentación Interactiva</h3>
        <p>FastAPI genera documentación automática:</p>
        <ul>
          <li><strong>Swagger UI</strong>: <code>http://localhost:8000/docs</code></li>
          <li><strong>ReDoc</strong>: <code>http://localhost:8000/redoc</code></li>
        </ul>
      `
    },
    {
      id: 'base-datos',
      title: 'Estructura de Base de Datos',
      category: 'Técnico',
      order: 16,
      tags: ['base de datos', 'mysql', 'tablas', 'esquema'],
      content: `
        <h2>Estructura de Base de Datos</h2>

        <h3>Base de Datos: agentsat_portal</h3>

        <h4>Tabla: users</h4>
        <p>Almacena información de usuarios del sistema</p>
        <table border="1" cellpadding="5">
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Descripción</th>
          </tr>
          <tr>
            <td>id</td>
            <td>INT (PK, AUTO_INCREMENT)</td>
            <td>Identificador único</td>
          </tr>
          <tr>
            <td>email</td>
            <td>VARCHAR(255) UNIQUE</td>
            <td>Correo electrónico (username)</td>
          </tr>
          <tr>
            <td>password_hash</td>
            <td>VARCHAR(255)</td>
            <td>Contraseña hasheada con bcrypt</td>
          </tr>
          <tr>
            <td>full_name</td>
            <td>VARCHAR(255)</td>
            <td>Nombre completo del usuario</td>
          </tr>
          <tr>
            <td>role</td>
            <td>VARCHAR(50)</td>
            <td>Rol: consulta, analista, contador, admin, superadmin</td>
          </tr>
          <tr>
            <td>is_active</td>
            <td>BOOLEAN</td>
            <td>Usuario activo (default: TRUE)</td>
          </tr>
          <tr>
            <td>created_at</td>
            <td>TIMESTAMP</td>
            <td>Fecha de creación</td>
          </tr>
          <tr>
            <td>updated_at</td>
            <td>TIMESTAMP</td>
            <td>Fecha de última modificación</td>
          </tr>
        </table>

        <h4>Tabla: cfdi</h4>
        <p>Almacena información de CFDIs procesados</p>
        <table border="1" cellpadding="5">
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Descripción</th>
          </tr>
          <tr>
            <td>id</td>
            <td>INT (PK, AUTO_INCREMENT)</td>
            <td>Identificador único</td>
          </tr>
          <tr>
            <td>uuid</td>
            <td>VARCHAR(36) UNIQUE</td>
            <td>Folio fiscal (UUID)</td>
          </tr>
          <tr>
            <td>serie</td>
            <td>VARCHAR(25)</td>
            <td>Serie del comprobante</td>
          </tr>
          <tr>
            <td>folio</td>
            <td>VARCHAR(40)</td>
            <td>Folio del comprobante</td>
          </tr>
          <tr>
            <td>fecha</td>
            <td>DATETIME</td>
            <td>Fecha de emisión</td>
          </tr>
          <tr>
            <td>tipo_comprobante</td>
            <td>VARCHAR(1)</td>
            <td>I, E, T, N, P</td>
          </tr>
          <tr>
            <td>emisor_rfc</td>
            <td>VARCHAR(13)</td>
            <td>RFC del emisor</td>
          </tr>
          <tr>
            <td>emisor_nombre</td>
            <td>VARCHAR(255)</td>
            <td>Nombre/Razón social del emisor</td>
          </tr>
          <tr>
            <td>receptor_rfc</td>
            <td>VARCHAR(13)</td>
            <td>RFC del receptor</td>
          </tr>
          <tr>
            <td>receptor_nombre</td>
            <td>VARCHAR(255)</td>
            <td>Nombre/Razón social del receptor</td>
          </tr>
          <tr>
            <td>subtotal</td>
            <td>DECIMAL(18,2)</td>
            <td>Subtotal</td>
          </tr>
          <tr>
            <td>descuento</td>
            <td>DECIMAL(18,2)</td>
            <td>Descuento aplicado</td>
          </tr>
          <tr>
            <td>total</td>
            <td>DECIMAL(18,2)</td>
            <td>Total del comprobante</td>
          </tr>
          <tr>
            <td>moneda</td>
            <td>VARCHAR(3)</td>
            <td>Código de moneda (MXN, USD, etc.)</td>
          </tr>
          <tr>
            <td>tipo_cambio</td>
            <td>DECIMAL(10,6)</td>
            <td>Tipo de cambio aplicado</td>
          </tr>
          <tr>
            <td>forma_pago</td>
            <td>VARCHAR(3)</td>
            <td>Código de forma de pago SAT</td>
          </tr>
          <tr>
            <td>metodo_pago</td>
            <td>VARCHAR(3)</td>
            <td>PUE, PPD, etc.</td>
          </tr>
          <tr>
            <td>estado_sat</td>
            <td>VARCHAR(50)</td>
            <td>Vigente, Cancelado</td>
          </tr>
          <tr>
            <td>estatus_validacion</td>
            <td>VARCHAR(50)</td>
            <td>pendiente, valido, rechazado, cancelado, revision</td>
          </tr>
          <tr>
            <td>validacion_sat_fecha</td>
            <td>DATETIME</td>
            <td>Fecha de última validación con SAT</td>
          </tr>
          <tr>
            <td>validacion_sat_respuesta</td>
            <td>TEXT</td>
            <td>Respuesta completa del SAT en JSON</td>
          </tr>
          <tr>
            <td>xml_content</td>
            <td>LONGTEXT</td>
            <td>Contenido XML completo</td>
          </tr>
          <tr>
            <td>archivo_path</td>
            <td>VARCHAR(500)</td>
            <td>Ruta del archivo XML en disco</td>
          </tr>
          <tr>
            <td>user_id</td>
            <td>INT (FK)</td>
            <td>Usuario que subió el CFDI</td>
          </tr>
          <tr>
            <td>created_at</td>
            <td>TIMESTAMP</td>
            <td>Fecha de creación en el sistema</td>
          </tr>
          <tr>
            <td>updated_at</td>
            <td>TIMESTAMP</td>
            <td>Fecha de última modificación</td>
          </tr>
        </table>

        <h3>Índices</h3>
        <ul>
          <li><strong>users</strong>:
            <ul>
              <li>idx_users_email (email)</li>
              <li>idx_users_role (role)</li>
            </ul>
          </li>
          <li><strong>cfdi</strong>:
            <ul>
              <li>idx_cfdi_uuid (uuid) - UNIQUE</li>
              <li>idx_cfdi_fecha (fecha)</li>
              <li>idx_cfdi_emisor_rfc (emisor_rfc)</li>
              <li>idx_cfdi_receptor_rfc (receptor_rfc)</li>
              <li>idx_cfdi_tipo (tipo_comprobante)</li>
              <li>idx_cfdi_estado_sat (estado_sat)</li>
              <li>idx_cfdi_validacion_fecha (validacion_sat_fecha)</li>
            </ul>
          </li>
        </ul>

        <h3>Relaciones</h3>
        <ul>
          <li><strong>cfdi.user_id</strong> → <strong>users.id</strong> (FK)</li>
        </ul>

        <h3>Migraciones Pendientes</h3>
        <p>Tablas por crear:</p>
        <ul>
          <li><strong>clientes</strong>: Catálogo de clientes</li>
          <li><strong>proveedores</strong>: Catálogo de proveedores</li>
          <li><strong>reportes_generados</strong>: Historial de reportes</li>
          <li><strong>configuracion</strong>: Configuración del sistema</li>
          <li><strong>audit_log</strong>: Registro de auditoría</li>
        </ul>

        <h3>Respaldos</h3>
        <p>Se recomienda realizar respaldos diarios de la base de datos usando:</p>
        <pre><code>mysqldump -u root -p agentsat_portal > backup_$(date +%Y%m%d).sql</code></pre>
      `
    },
    {
      id: 'solución-problemas',
      title: 'Solución de Problemas Comunes',
      category: 'Soporte',
      order: 17,
      tags: ['problemas', 'errores', 'troubleshooting', 'soporte'],
      content: `
        <h2>Solución de Problemas Comunes</h2>

        <h3>Problemas de Autenticación</h3>

        <h4>Error: "Credenciales inválidas"</h4>
        <p><strong>Causas posibles:</strong></p>
        <ul>
          <li>Email o contraseña incorrectos</li>
          <li>Cuenta desactivada</li>
          <li>Mayúsculas/minúsculas en la contraseña</li>
        </ul>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar que el email esté escrito correctamente</li>
          <li>Verificar la contraseña (las mayúsculas importan)</li>
          <li>Si olvidó su contraseña, contacte al administrador</li>
          <li>Verificar que la cuenta esté activa</li>
        </ol>

        <h4>Error: "Token expirado"</h4>
        <p><strong>Causa:</strong> La sesión ha expirado por inactividad</p>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Cerrar sesión</li>
          <li>Iniciar sesión nuevamente</li>
        </ol>

        <h3>Problemas con CFDIs</h3>

        <h4>Error al cargar CFDIs: "Error al cargar CFDIs: [object Object]"</h4>
        <p><strong>Causas posibles:</strong></p>
        <ul>
          <li>Servidor backend no disponible</li>
          <li>Error de conexión a base de datos</li>
          <li>Problema con dependencias del backend</li>
        </ul>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar que el backend esté corriendo: <code>docker ps</code></li>
          <li>Revisar logs del backend: <code>docker logs agentsat_backend</code></li>
          <li>Reconstruir contenedores si es necesario</li>
          <li>Contactar al administrador del sistema</li>
        </ol>

        <h4>"XML inválido" al subir CFDI</h4>
        <p><strong>Causas posibles:</strong></p>
        <ul>
          <li>Archivo no es un XML válido</li>
          <li>XML no cumple con estructura de CFDI 3.3 o 4.0</li>
          <li>Archivo corrupto</li>
        </ul>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar que el archivo sea un XML válido</li>
          <li>Abrir el archivo en un editor de texto y revisar que sea un CFDI</li>
          <li>Intentar con otro archivo para descartar problemas del archivo específico</li>
        </ol>

        <h4>Validación SAT falla</h4>
        <p><strong>Causas posibles:</strong></p>
        <ul>
          <li>Servicio del SAT no disponible</li>
          <li>UUID no existe en registros del SAT</li>
          <li>Problemas de conectividad</li>
        </ul>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar conexión a internet</li>
          <li>Intentar nuevamente más tarde (el SAT puede estar en mantenimiento)</li>
          <li>Verificar que el UUID sea correcto</li>
        </ol>

        <h3>Problemas de Permisos</h3>

        <h4>"No tiene permisos para acceder a esta función"</h4>
        <p><strong>Causa:</strong> Su rol no tiene los permisos necesarios</p>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar su rol en el perfil de usuario</li>
          <li>Contactar al administrador si necesita permisos adicionales</li>
          <li>Revisar la documentación de roles y permisos</li>
        </ol>

        <h3>Problemas de Compilación (Frontend)</h3>

        <h4>Error: "Module not found" o dependencias faltantes</h4>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Reconstruir el contenedor frontend:
            <pre><code>docker-compose down
docker-compose up -d --build</code></pre>
          </li>
          <li>Si persiste, eliminar volúmenes y reconstruir:
            <pre><code>docker-compose down -v
docker-compose up -d --build</code></pre>
          </li>
        </ol>

        <h3>Problemas de Base de Datos</h3>

        <h4>Error de conexión a base de datos</h4>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar que el contenedor MySQL esté corriendo</li>
          <li>Revisar credenciales en archivo .env</li>
          <li>Verificar que el puerto 3306 no esté siendo usado por otro servicio</li>
        </ol>

        <h3>Rendimiento Lento</h3>

        <h4>El sistema responde lentamente</h4>
        <p><strong>Causas posibles:</strong></p>
        <ul>
          <li>Gran cantidad de datos en tablas</li>
          <li>Recursos del servidor limitados</li>
          <li>Consultas no optimizadas</li>
        </ul>
        <p><strong>Solución:</strong></p>
        <ol>
          <li>Verificar uso de recursos: <code>docker stats</code></li>
          <li>Limitar cantidad de registros mostrados</li>
          <li>Usar filtros para reducir dataset</li>
          <li>Contactar al administrador para optimización</li>
        </ol>

        <h3>Contacto de Soporte</h3>
        <p>Si los problemas persisten después de intentar estas soluciones:</p>
        <ul>
          <li>Contacte al administrador del sistema</li>
          <li>Proporcione capturas de pantalla del error</li>
          <li>Describa los pasos que llevaron al problema</li>
          <li>Indique su rol de usuario y navegador utilizado</li>
        </ul>
      `
    }
  ];

  useEffect(() => {
    // Filtrar artículos según búsqueda
    if (searchQuery.trim() === '') {
      const sortedArticles = [...knowledgeBase].sort((a, b) => a.order - b.order);
      setFilteredArticles(sortedArticles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = knowledgeBase.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query)) ||
          article.content.toLowerCase().includes(query)
      );
      setFilteredArticles(filtered.sort((a, b) => a.order - b.order));
    }
  }, [searchQuery, knowledgeBase]);

  const handleArticleClick = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setSearchQuery('');
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  // Agrupar artículos por categoría
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, KnowledgeBaseArticle[]>);

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Centro de Ayuda
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Base de conocimiento y documentación completa del sistema
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Sidebar con lista de artículos */}
          <Paper
            sx={{
              width: 350,
              minHeight: 'calc(100vh - 200px)',
              p: 2,
              display: selectedArticle ? 'none' : 'block',
              '@media (min-width: 900px)': {
                display: 'block',
              },
            }}
          >
            {/* Buscador */}
            <TextField
              fullWidth
              placeholder="Buscar en la ayuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Lista de artículos agrupados por categoría */}
            <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              {Object.keys(groupedArticles)
                .sort()
                .map((category) => (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Typography
                      variant="overline"
                      sx={{ fontWeight: 700, color: '#667eea', mb: 1, display: 'block' }}
                    >
                      {category}
                    </Typography>
                    <List dense>
                      {groupedArticles[category].map((article) => (
                        <ListItem key={article.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleArticleClick(article)}
                            selected={selectedArticle?.id === article.id}
                          >
                            <ListItemText
                              primary={article.title}
                              primaryTypographyProps={{
                                fontSize: '0.9rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* Contenido del artículo */}
          <Paper
            sx={{
              flex: 1,
              p: 4,
              minHeight: 'calc(100vh - 200px)',
            }}
          >
            {selectedArticle ? (
              <>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 3 }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={handleBackToList}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <HomeIcon fontSize="small" />
                    Inicio
                  </Link>
                  <Typography color="text.primary">{selectedArticle.category}</Typography>
                  <Typography color="text.primary">{selectedArticle.title}</Typography>
                </Breadcrumbs>

                {/* Botón de regreso (mobile) */}
                <IconButton
                  onClick={handleBackToList}
                  sx={{
                    mb: 2,
                    display: { xs: 'inline-flex', md: 'none' },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>

                {/* Categoría */}
                <Chip
                  label={selectedArticle.category}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />

                {/* Título del artículo */}
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                  {selectedArticle.title}
                </Typography>

                {/* Tags */}
                <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedArticle.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Contenido HTML del artículo */}
                <Box
                  sx={{
                    '& h2': {
                      fontSize: '1.75rem',
                      fontWeight: 600,
                      mt: 3,
                      mb: 2,
                      color: '#667eea',
                    },
                    '& h3': {
                      fontSize: '1.4rem',
                      fontWeight: 600,
                      mt: 2.5,
                      mb: 1.5,
                    },
                    '& h4': {
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      mt: 2,
                      mb: 1,
                    },
                    '& p': {
                      mb: 1.5,
                      lineHeight: 1.7,
                    },
                    '& ul, & ol': {
                      mb: 2,
                      pl: 3,
                    },
                    '& li': {
                      mb: 0.5,
                      lineHeight: 1.6,
                    },
                    '& code': {
                      backgroundColor: '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.9em',
                    },
                    '& pre': {
                      backgroundColor: '#2d3748',
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      overflow: 'auto',
                      mb: 2,
                    },
                    '& pre code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                      color: '#fff',
                    },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      mb: 2,
                    },
                    '& th': {
                      backgroundColor: '#667eea',
                      color: '#fff',
                      padding: '12px',
                      textAlign: 'left',
                      fontWeight: 600,
                    },
                    '& td': {
                      padding: '10px 12px',
                      borderBottom: '1px solid #e0e0e0',
                    },
                    '& a': {
                      color: '#667eea',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </>
            ) : (
              <>
                {/* Vista inicial sin artículo seleccionado */}
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PlayArrowIcon sx={{ fontSize: 100, color: '#667eea', opacity: 0.3, mb: 3 }} />
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Bienvenido al Centro de Ayuda
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                    Seleccione un artículo de la lista de la izquierda para ver la documentación completa.
                    Use el buscador para encontrar temas específicos.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de artículos: <strong>{knowledgeBase.length}</strong>
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default AyudaPage;
