
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
  register: (nombre: string, email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USER_KEY = 'serviceMatchUser';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(FAKE_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email: string) => {
    // En una aplicación real, llamarías a una API. Aquí lo simulamos.
    const newUser: User = { id: Date.now().toString(), nombre: email.split('@')[0], email };
    localStorage.setItem(FAKE_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const register = (nombre: string, email: string) => {
    // Similar al login para esta simulación
    const newUser: User = { id: Date.now().toString(), nombre, email };
    localStorage.setItem(FAKE_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    // Limpiar todos los datos específicos del usuario
    localStorage.removeItem(FAKE_USER_KEY);
    // Estos son de AppContext, limpiarlos al cerrar sesión previene fugas de datos entre sesiones
    localStorage.removeItem('perfil');
    localStorage.removeItem('servicios');
    localStorage.removeItem('emails');
    localStorage.removeItem('prospectos');
    localStorage.removeItem('llamadas');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};