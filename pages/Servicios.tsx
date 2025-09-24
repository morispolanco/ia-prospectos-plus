
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Servicio } from '../types';

const ServicioCard: React.FC<{ servicio: Servicio; onRemove: (id: string) => void }> = ({ servicio, onRemove }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">{servicio.nombre}</h3>
        <p className="text-gray-600 dark:text-gray-400">{servicio.descripcion}</p>
      </div>
      <button 
        onClick={() => onRemove(servicio.id)} 
        className="mt-4 self-end text-red-500 hover:text-red-700 font-semibold"
      >
        Eliminar
      </button>
    </div>
  );
};


export const Servicios: React.FC = () => {
  const { servicios, addServicio, removeServicio } = useAppContext();
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', descripcion: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoServicio(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoServicio.nombre && nuevoServicio.descripcion) {
      addServicio(nuevoServicio);
      setNuevoServicio({ nombre: '', descripcion: '' });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Añadir Servicio</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  value={nuevoServicio.nombre}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Desarrollo Web"
                  required
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  id="descripcion"
                  rows={4}
                  value={nuevoServicio.descripcion}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe brevemente qué ofreces"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Añadir Servicio
              </button>
            </form>
          </div>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Mis Servicios</h2>
          {servicios.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {servicios.map(servicio => (
                <ServicioCard key={servicio.id} servicio={servicio} onRemove={removeServicio} />
              ))}
            </div>
          ) : (
            <div className="text-center bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md">
              <p className="text-gray-500 dark:text-gray-400">Aún no has añadido ningún servicio. ¡Empieza por añadir uno en el formulario!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};