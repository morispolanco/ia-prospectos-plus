import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';

const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
const activeLinkClasses = "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white";
const inactiveLinkClasses = "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isGoogleSignedIn, signIn, signOut, isReady, error } = useGoogleAuth();

  const isProspectosActive = location.pathname.startsWith('/prospecto') || location.pathname === '/prospectos';

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
    
  const getProspectosLinkClass = () => 
    `${navLinkClasses} ${isProspectosActive ? activeLinkClasses : inactiveLinkClasses}`;

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirigir al login después de cerrar sesión
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length > 1 && words[0] && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (name.length > 1) {
        return name.substring(0, 2).toUpperCase();
    }
    return name.toUpperCase();
  };

  const renderGmailButton = () => {
    if (isGoogleSignedIn) {
      return (
        <button onClick={signOut} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 mr-4">
            Desconectar Google
        </button>
      );
    }
    if (error) {
        return (
            <div 
                className="flex items-center mr-4 cursor-pointer" 
                title="Haz clic para ver detalles del error"
                onClick={() => alert(error)}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 <span className="text-sm text-red-500">Error de Configuración de Google</span>
            </div>
        );
    }
    return (
      <button onClick={signIn} disabled={!isReady} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-wait mr-4">
          {isReady ? 'Conectar Gmail' : 'Cargando...'}
      </button>
    );
  };


  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <NavLink to="/" className="text-xl font-bold text-gray-800 dark:text-white">
                ServiceMatch
              </NavLink>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavLink to="/" className={getNavLinkClass}>Dashboard</NavLink>
                <NavLink to="/servicios" className={getNavLinkClass}>Mis Servicios</NavLink>
                <NavLink to="/busqueda" className={getNavLinkClass}>Búsqueda</NavLink>
                <NavLink to="/prospectos" className={getProspectosLinkClass}>Prospectos</NavLink>
                <NavLink to="/emails" className={getNavLinkClass}>Emails</NavLink>
                <NavLink to="/perfil" className={getNavLinkClass}>Perfil</NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user && (
                 <>
                   {renderGmailButton()}
                   <span className="text-gray-600 dark:text-gray-300 text-sm mr-3">Hola, {user.nombre}</span>
                   <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm mr-4" title={user.email}>
                     {getInitials(user.nombre)}
                   </div>
                   <button onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                     Cerrar Sesión
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};