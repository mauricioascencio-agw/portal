import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  client_id?: string;
  client_name?: string;
  company?: string;
  phone?: string;
  position?: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar usuario al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Configurar axios con el token
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login-json', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      // Guardar en localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Actualizar estado
      setToken(access_token);
      setUser(userData);

      // Configurar axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      throw new Error(
        error.response?.data?.detail || 'Error al iniciar sesión'
      );
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      // Después del registro, iniciar sesión automáticamente
      await login(userData.email, userData.password);
    } catch (error: any) {
      console.error('Error al registrarse:', error);
      throw new Error(
        error.response?.data?.detail || 'Error al registrarse'
      );
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Limpiar estado
    setToken(null);
    setUser(null);

    // Limpiar axios
    delete axios.defaults.headers.common['Authorization'];

    // Redirigir al login
    navigate('/login');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
