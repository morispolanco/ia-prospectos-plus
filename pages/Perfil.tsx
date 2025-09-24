
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Perfil: React.FC = () => {
  const { perfil, setPerfil, googleClientId, setGoogleClientId } = useAppContext();
  const [formData, setFormData] = useState(perfil);
  const [localGoogleClientId, setLocalGoogleClientId] = useState(googleClientId);
  const [saved, setSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Don't show error for empty field until submit
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      if (!validateEmail(value)) {
        setEmailError('Por favor, introduce un formato de email válido.');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email) || !formData.email) {
      setEmailError('Por favor, introduce un formato de email válido.');
      return;
    }
    
    setPerfil(formData);
    setGoogleClientId(localGoogleClientId);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          Mi Perfil
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Esta información se utilizará para firmar los correos electrónicos que generes y para conectar tus servicios.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tu Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="Ej: juan.perez@tuempresa.com"
              required
            />
            {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
          </div>
          <div>
            <label htmlFor="paginaWeb" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Página Web o Portfolio
            </label>
            <input
              type="url"
              name="paginaWeb"
              id="paginaWeb"
              value={formData.paginaWeb}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: https://www.tuempresa.com"
              required
            />
          </div>
          <div>
            <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Google Client ID (para borradores de Gmail)
            </label>
            <input
              type="text"
              name="googleClientId"
              id="googleClientId"
              value={localGoogleClientId}
              onChange={(e) => setLocalGoogleClientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Tu ID de cliente de Google"
            />
             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Necesario para la integración con Gmail. Obtén uno desde la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Consola de Google Cloud</a>.
            </p>
          </div>
          <div className="flex items-center justify-end space-x-4">
            {saved && (
              <span className="text-green-600 dark:text-green-400 font-medium">¡Perfil guardado!</span>
            )}
            <button
              type="submit"
              disabled={!!emailError}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};