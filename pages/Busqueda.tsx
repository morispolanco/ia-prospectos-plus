import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { buscarClientes } from '../services/geminiService';
import type { ClientePotencial } from '../types';
import { Spinner } from '../components/Spinner';
import { ClientCard } from '../components/ClientCard';

export const Busqueda: React.FC = () => {
  const { servicios, perfil, addProspectos } = useAppContext();
  const [filtros, setFiltros] = useState({ servicioId: '', sector: '', ubicacion: '' });
  const [resultados, setResultados] = useState<ClientePotencial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveMessage, setSaveMessage] = useState('');

  const isFormValid = filtros.servicioId && filtros.sector && filtros.ubicacion && perfil.nombre;

  const handleSelectProspecto = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (resultados.length === 0) return;
    if (selectedIds.size === resultados.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(resultados.map(p => p.id)));
    }
  };

  const handleSaveSelected = () => {
    const selectedProspectos = resultados.filter(p => selectedIds.has(p.id));
    if (selectedProspectos.length > 0) {
      addProspectos(selectedProspectos);
      setSaveMessage(`${selectedProspectos.length} prospecto(s) guardado(s) correctamente.`);
      setSelectedIds(new Set());
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        setError('Por favor, completa todos los filtros y asegúrate de haber configurado tu perfil.');
        return;
    }
    
    setIsLoading(true);
    setError('');
    setResultados([]);
    setSelectedIds(new Set());

    const servicioSeleccionado = servicios.find(s => s.id === filtros.servicioId);
    if (servicioSeleccionado) {
      try {
        const clientes = await buscarClientes(servicioSeleccionado, filtros.sector, filtros.ubicacion);
        const clientesOrdenados = clientes.sort((a, b) => b.probabilidadContratacion - a.probabilidadContratacion);
        setResultados(clientesOrdenados);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al buscar clientes.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Búsqueda de Prospectos</h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="servicioId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servicio</label>
            <select id="servicioId" value={filtros.servicioId} onChange={e => setFiltros({...filtros, servicioId: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
              <option value="">Selecciona un servicio</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sector</label>
            <input type="text" id="sector" value={filtros.sector} onChange={e => setFiltros({...filtros, sector: e.target.value})} placeholder="Ej: Abogados, Restaurantes" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</label>
            <input type="text" id="ubicacion" value={filtros.ubicacion} onChange={e => setFiltros({...filtros, ubicacion: e.target.value})} placeholder="Ej: Guatemala, Ciudad de México" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
          </div>
          <button type="submit" disabled={!isFormValid || isLoading} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {!perfil.nombre && <p className="text-yellow-600 mt-4">Advertencia: Debes configurar tu perfil antes de poder generar correos.</p>}
      </div>

      {isLoading && <Spinner message="Buscando clientes potenciales..." />}

      {resultados.length > 0 && (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      <span>{selectedIds.size} de {resultados.length} seleccionados</span>
                  </div>
                  <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                      {selectedIds.size === resultados.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
              </div>
              <div>
                  <button
                      onClick={handleSaveSelected}
                      disabled={selectedIds.size === 0}
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                      Guardar en "Mis Prospectos"
                  </button>
              </div>
            </div>
             {saveMessage && <p className="text-center text-green-600 dark:text-green-400 mb-4">{saveMessage}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultados.map((cliente) => (
                <ClientCard 
                  key={cliente.id} 
                  cliente={cliente} 
                  isSelected={selectedIds.has(cliente.id)}
                  onSelect={handleSelectProspecto}
                />
            ))}
            </div>
        </div>
      )}
    </div>
  );
};