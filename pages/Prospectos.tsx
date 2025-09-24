
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generarEmail } from '../services/geminiService';
import { ClientCard } from '../components/ClientCard';
import { Spinner } from '../components/Spinner';

export const Prospectos: React.FC = () => {
    const { prospectos, removeProspectos, servicios, perfil, addEmail } = useAppContext();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedServicioId, setSelectedServicioId] = useState<string>('');
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        sector: '',
        ubicacion: '',
        probabilidadMin: '',
        probabilidadMax: '',
        fechaInicio: '',
        fechaFin: '',
    });
    const [sortBy, setSortBy] = useState('probabilidad');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            sector: '',
            ubicacion: '',
            probabilidadMin: '',
            probabilidadMax: '',
            fechaInicio: '',
            fechaFin: '',
        });
        setSortBy('probabilidad');
    };

    const filteredAndSortedProspectos = useMemo(() => {
        let displayedProspectos = [...prospectos];

        // Apply filters
        if (filters.sector.trim()) {
            displayedProspectos = displayedProspectos.filter(p =>
                p.sector.toLowerCase().includes(filters.sector.toLowerCase().trim())
            );
        }
        if (filters.ubicacion.trim()) {
            displayedProspectos = displayedProspectos.filter(p =>
                p.ubicacion.toLowerCase().includes(filters.ubicacion.toLowerCase().trim())
            );
        }
        const probMin = parseFloat(filters.probabilidadMin);
        if (!isNaN(probMin)) {
            displayedProspectos = displayedProspectos.filter(p => p.probabilidadContratacion >= probMin);
        }
        const probMax = parseFloat(filters.probabilidadMax);
        if (!isNaN(probMax)) {
            displayedProspectos = displayedProspectos.filter(p => p.probabilidadContratacion <= probMax);
        }
        if (filters.fechaInicio) {
            const startDate = new Date(`${filters.fechaInicio}T00:00:00Z`);
            displayedProspectos = displayedProspectos.filter(p => new Date(p.fechaAgregado) >= startDate);
        }
        if (filters.fechaFin) {
            const endDate = new Date(`${filters.fechaFin}T23:59:59Z`);
            displayedProspectos = displayedProspectos.filter(p => new Date(p.fechaAgregado) <= endDate);
        }

        // Apply sorting
        const sorted = [...displayedProspectos];
        switch (sortBy) {
            case 'nombre':
                sorted.sort((a, b) => a.nombreEmpresa.localeCompare(b.nombreEmpresa));
                break;
            case 'fecha':
                sorted.sort((a, b) => new Date(b.fechaAgregado).getTime() - new Date(a.fechaAgregado).getTime());
                break;
            case 'probabilidad':
            default:
                sorted.sort((a, b) => b.probabilidadContratacion - a.probabilidadContratacion);
                break;
        }

        return sorted;
    }, [prospectos, filters, sortBy]);

    const areAllVisibleSelected = useMemo(() => 
        filteredAndSortedProspectos.length > 0 && filteredAndSortedProspectos.every(p => selectedIds.has(p.id)),
        [filteredAndSortedProspectos, selectedIds]
    );

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
        const allVisibleIds = new Set(filteredAndSortedProspectos.map(p => p.id));
        if (areAllVisibleSelected) {
            setSelectedIds(prev => {
                const newSet = new Set(prev);
                allVisibleIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        } else {
            setSelectedIds(prev => new Set([...Array.from(prev), ...allVisibleIds]));
        }
    };

    const handleRemoveSelected = () => {
        removeProspectos(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const handleGenerateSelectedEmails = async () => {
        const selectedServicio = servicios.find(s => s.id === selectedServicioId);
        if (!selectedServicio) {
            setError('Por favor, selecciona un servicio para generar los emails.');
            return;
        }
        if (!perfil.nombre) {
            setError('Por favor, configura tu perfil antes de generar emails.');
            return;
        }
        if (selectedIds.size === 0) {
            setError('Por favor, selecciona al menos un prospecto.');
            return;
        }
        setError('');

        const selectedProspectos = prospectos.filter(p => selectedIds.has(p.id));

        setIsBulkGenerating(true);
        setBulkMessage('Iniciando generación masiva...');
        
        let successCount = 0;
        let errorCount = 0;
        for (let i = 0; i < selectedProspectos.length; i++) {
            const cliente = selectedProspectos[i];
            setBulkMessage(`Generando email ${i + 1} de ${selectedProspectos.length} para ${cliente.nombreEmpresa}...`);
            try {
                const emailJson = await generarEmail(cliente, selectedServicio, perfil);
                const parsedEmail = JSON.parse(emailJson);
                addEmail({
                    destinatario: cliente,
                    servicio: selectedServicio,
                    cuerpo: JSON.stringify(parsedEmail),
                });
                successCount++;
            } catch(error) {
                console.error("Error generating email for:", cliente.nombreEmpresa, error);
                errorCount++;
            }
        }

        setBulkMessage(`${successCount} de ${selectedProspectos.length} emails generados y guardados. ${errorCount > 0 ? `${errorCount} fallaron.` : ''}`);
        setIsBulkGenerating(false);
        
        setTimeout(() => setBulkMessage(''), 5000);
    };

    if (prospectos.length === 0) {
        return (
            <div className="container mx-auto p-6 text-center">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No tienes prospectos guardados</h2>
                    <p className="text-gray-500 dark:text-gray-400">Ve a la página de 'Búsqueda' para encontrar y guardar nuevos prospectos.</p>
                    <Link to="/busqueda" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                        Ir a Búsqueda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Mis Prospectos</h2>
            
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sector</label>
                        <input type="text" id="sector" name="sector" value={filters.sector} onChange={handleFilterChange} placeholder="Filtrar por sector..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                        <input type="text" id="ubicacion" name="ubicacion" value={filters.ubicacion} onChange={handleFilterChange} placeholder="Filtrar por ubicación..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Probabilidad (%)</label>
                        <div className="flex items-center gap-2">
                            <input type="number" name="probabilidadMin" value={filters.probabilidadMin} onChange={handleFilterChange} placeholder="Mín" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <input type="number" name="probabilidadMax" value={filters.probabilidadMax} onChange={handleFilterChange} placeholder="Máx" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Agregado</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="fechaInicio" value={filters.fechaInicio} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <input type="date" name="fechaFin" value={filters.fechaFin} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordenar por</label>
                        <select id="sortBy" value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="probabilidad">Potencial (Mayor a menor)</option>
                            <option value="nombre">Nombre (A-Z)</option>
                            <option value="fecha">Fecha (Recientes primero)</option>
                        </select>
                    </div>
                    <button onClick={resetFilters} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500">
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                        <span>{selectedIds.size} de {prospectos.length} seleccionados</span>
                         <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">({filteredAndSortedProspectos.length} visibles)</span>
                    </div>
                     <button
                        onClick={handleSelectAll}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                    >
                        {areAllVisibleSelected ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedServicioId}
                      onChange={e => {
                        setSelectedServicioId(e.target.value);
                        setError('');
                      }}
                      className="block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecciona un servicio</option>
                      {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <button
                        onClick={handleGenerateSelectedEmails}
                        disabled={isBulkGenerating || selectedIds.size === 0}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isBulkGenerating ? 'Generando...' : 'Generar Emails'}
                    </button>
                    <button
                        onClick={handleRemoveSelected}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        Eliminar Seleccionados
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            {isBulkGenerating && <Spinner message={bulkMessage} />}
            {bulkMessage && !isBulkGenerating && <p className="text-center text-blue-600 dark:text-blue-400 mb-4">{bulkMessage}</p>}


            {!isBulkGenerating && (
                <>
                    {filteredAndSortedProspectos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedProspectos.map((cliente) => (
                                <ClientCard 
                                    key={cliente.id} 
                                    cliente={cliente}
                                    isSelected={selectedIds.has(cliente.id)}
                                    onSelect={handleSelectProspecto}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md">
                            <p className="text-gray-500 dark:text-gray-400">No se encontraron prospectos que coincidan con tus filtros.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};