import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CfdisPage from './pages/cfdis/CfdisPage';
import CFDIDetailPage from './pages/cfdis/CFDIDetailPage';
import ReportesPage from './pages/reportes/ReportesPage';
import ReporteFiscalPage from './pages/reportes/ReporteFiscalPage';
import ReporteEjecutivoPage from './pages/reportes/ReporteEjecutivoPage';
import ReporteConciliacionPage from './pages/reportes/ReporteConciliacionPage';
import KpisPage from './pages/kpis/KpisPage';
import ChartsPage from './pages/charts/ChartsPage';
import DescargaMasivaSATPage from './pages/descarga-masiva-sat/DescargaMasivaSATPage';
import AyudaPage from './pages/ayuda/AyudaPage';
import FIELConfigPage from './pages/configuracion/FIELConfigPage';
import ConstanciaFiscalPage from './pages/configuracion/ConstanciaFiscalPage';
import AIConfigPage from './pages/configuracion/AIConfigPage';
import GeneralConfigPage from './pages/configuracion/GeneralConfigPage';
import MCPAgentPage from './pages/mcp/MCPAgentPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ClientesPage from './pages/catalogos/ClientesPage';
import ProveedoresPage from './pages/catalogos/ProveedoresPage';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Routes>
      {/* Ruta raíz */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cfdis"
        element={
          <ProtectedRoute>
            <CfdisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cfdis-detalle/:id"
        element={
          <ProtectedRoute>
            <CFDIDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <ReportesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kpis"
        element={
          <ProtectedRoute>
            <KpisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/graficas"
        element={
          <ProtectedRoute>
            <ChartsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/charts"
        element={
          <ProtectedRoute>
            <ChartsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/descarga-masiva-sat"
        element={
          <ProtectedRoute>
            <DescargaMasivaSATPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ayuda"
        element={
          <ProtectedRoute>
            <AyudaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/fiel"
        element={
          <ProtectedRoute>
            <FIELConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mcp-agent"
        element={
          <ProtectedRoute>
            <MCPAgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas de Configuración */}
      <Route
        path="/configuracion/general"
        element={
          <ProtectedRoute>
            <GeneralConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/constancia"
        element={
          <ProtectedRoute>
            <ConstanciaFiscalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/ia"
        element={
          <ProtectedRoute>
            <AIConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/email"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Correo Electrónico" description="Configuración de servidor de correo electrónico." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/folders"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Carpetas" description="Configuración de carpetas del sistema." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/templates"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Plantillas y Temas" description="Gestión de plantillas y temas visuales." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/mcp"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Conexión MCP" description="Configuración de conexión MCP." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion/ai"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Configuración IA" description="Configuración de inteligencia artificial." />
          </ProtectedRoute>
        }
      />

      {/* Rutas de Reportes */}
      <Route
        path="/reportes/kpi"
        element={
          <ProtectedRoute>
            <KpisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes/fiscal"
        element={
          <ProtectedRoute>
            <ReporteFiscalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes/ejecutivo"
        element={
          <ProtectedRoute>
            <ReporteEjecutivoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes/conciliacion"
        element={
          <ProtectedRoute>
            <ReporteConciliacionPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas de Catálogos */}
      <Route
        path="/catalogos/clientes"
        element={
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalogos/usuarios"
        element={
          <ProtectedRoute>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalogos/proveedores"
        element={
          <ProtectedRoute>
            <ProveedoresPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalogos/productos"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Catálogo de Productos/Servicios" description="Gestión del catálogo de productos y servicios." />
          </ProtectedRoute>
        }
      />

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <AppConfigProvider>
              <AppContent />
            </AppConfigProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
