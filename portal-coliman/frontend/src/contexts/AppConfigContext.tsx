import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface AppConfig {
  id: number;
  company_name: string;
  short_name: string | null;
  version: string | null;
  description: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  company_rfc: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string | null;
}

interface AppConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  // Helpers para acceso rápido
  companyName: string;
  shortName: string;
  version: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
}

const defaultConfig: AppConfig = {
  id: 0,
  company_name: 'Portal',
  short_name: null,
  version: '2.0',
  description: null,
  primary_color: '#667eea',
  secondary_color: '#764ba2',
  contact_email: null,
  contact_phone: null,
  address: null,
  company_rfc: null,
  footer_text: null,
  created_at: '',
  updated_at: null,
};

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/config/general');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (err: any) {
      console.error('Error al cargar configuración del portal:', err);
      setError('No se pudo cargar la configuración');
      // Usar configuración por defecto en caso de error
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refreshConfig = async () => {
    await fetchConfig();
  };

  // Helpers para acceso rápido con valores por defecto
  const companyName = config?.company_name || 'Portal';
  const shortName = config?.short_name || companyName;
  const version = config?.version || '2.0';
  const footerText = config?.footer_text || `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;
  const primaryColor = config?.primary_color || '#667eea';
  const secondaryColor = config?.secondary_color || '#764ba2';

  // Actualizar el título del documento cuando cambie la configuración
  useEffect(() => {
    if (companyName) {
      document.title = companyName;
    }
  }, [companyName]);

  const value: AppConfigContextType = {
    config,
    isLoading,
    error,
    refreshConfig,
    companyName,
    shortName,
    version,
    footerText,
    primaryColor,
    secondaryColor,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig debe ser usado dentro de AppConfigProvider');
  }
  return context;
};
