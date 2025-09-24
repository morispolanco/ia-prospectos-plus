
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner message="Verificando sesión..." />
      </div>
    );
  }

  if (!user) {
    // Redirige a la página de /login, pero guarda la ubicación actual a la que intentaban ir.
    // Esto permite enviarlos a esa página después de iniciar sesión, lo cual es una mejor experiencia de usuario.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};