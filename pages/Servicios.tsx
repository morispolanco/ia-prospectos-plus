
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Servicio } from '../types';

// Modal component for editing a service
const EditServiceModal: React.FC<{
  servicio: Servicio | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (servicio: Servicio) => void;
}> = ({ servicio, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', paginaWeb: '' });

  useEffect(() => {
    if (servicio) {
      setFormData({ nombre: servicio.nombre, descripcion: servicio.descripcion, paginaWeb: servicio.paginaWeb || '' });
    }
  }, [servicio]);

  if (!isOpen || !servicio) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre && formData.descripcion) {
      onSave({ ...servicio, ...formData });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Editar Servicio</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  id="edit-descripcion"
                  rows={4}
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-paginaWeb" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página Web del Servicio (Opcional)
                </label>
                <input
                  type="url"
                  name="paginaWeb"
                  id="edit-paginaWeb"
                  value={formData.paginaWeb}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://ejemplo-servicio.com"
                />
                 <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Esta web se usará en la firma del email en lugar de la web de tu perfil.</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const ServicioCard: React.FC<{ servicio: Servicio; onRemove: (id: string) => void; onEdit: (servicio: Servicio) => void; }> = ({ servicio, onRemove, onEdit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">{servicio.nombre}</h3>
        <p className="text-gray-600 dark:text-gray-400">{servicio.descripcion}</p>
        {servicio.paginaWeb && (
            <a 
              href={servicio.paginaWeb} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-3 text-sm text-blue-500 hover:underline break-all block"
            >
              {servicio.paginaWeb}
            </a>
          )}
      </div>
      <div className="mt-4 flex justify-end space-x-4">
        <button 
          onClick={() => onEdit(servicio)}
          className="font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Editar
        </button>
        <button 
          onClick={() => onRemove(servicio.id)} 
          className="font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};


export const Servicios: React.FC = () => {
  const { servicios, addServicio, removeServicio, updateServicio } = useAppContext();
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', descripcion: '', paginaWeb: '' });
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoServicio(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoServicio.nombre && nuevoServicio.descripcion) {
      addServicio(nuevoServicio);
      setNuevoServicio({ nombre: '', descripcion: '', paginaWeb: '' });
    }
  };

  const handleSaveEdit = (servicio: Servicio) => {
    updateServicio(servicio);
    setEditingServicio(null);
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 sticky top-24">
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
                <div>
                  <label htmlFor="paginaWeb" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Página Web del Servicio (Opcional)
                  </label>
                  <input
                    type="url"
                    name="paginaWeb"
                    id="paginaWeb"
                    value={nuevoServicio.paginaWeb || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://ejemplo-servicio.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Si se proporciona, se usará en la firma del email.</p>
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
                  <ServicioCard 
                    key={servicio.id} 
                    servicio={servicio} 
                    onRemove={removeServicio} 
                    onEdit={setEditingServicio}
                  />
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
      <EditServiceModal 
        servicio={editingServicio}
        isOpen={!!editingServicio}
        onClose={() => setEditingServicio(null)}
        onSave={handleSaveEdit}
      />
    </>
  );
};