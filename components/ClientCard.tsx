
import React from 'react';
import { Link } from 'react-router-dom';
import type { ClientePotencial } from '../types';

interface ClientCardProps {
  cliente: ClientePotencial;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showCheckbox?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ cliente, isSelected, onSelect, showCheckbox = true }) => {
  
  const getScoreColor = (score: number) => {
    if (score > 89) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };
  
  return (
    <div onClick={() => onSelect(cliente.id)} className={`relative bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col justify-between h-full cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-xl hover:-translate-y-1'}`}>
      {showCheckbox && (
         <div className="absolute top-4 right-4 z-10">
            <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            />
        </div>
      )}
      <div>
        <div className="flex justify-between items-start mb-2">
            <Link to={`/prospecto/${cliente.id}`} onClick={(e) => e.stopPropagation()} className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-1 pr-4 hover:underline">{cliente.nombreEmpresa}</Link>
            <div className="text-center flex-shrink-0">
                <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getScoreColor(cliente.probabilidadContratacion)}`}>
                    {cliente.probabilidadContratacion}%
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Potencial</p>
            </div>
        </div>
        <a href={cliente.paginaWeb} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-sm text-gray-500 hover:underline break-all">{cliente.paginaWeb}</a>
        <div className="my-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="font-semibold text-gray-800 dark:text-gray-200">{cliente.contacto.nombre} - <span className="font-normal">{cliente.contacto.cargo}</span></p>
          <div className="flex items-center gap-2">
            <p className="text-gray-600 dark:text-gray-400">{cliente.contacto.email}</p>
            {cliente.contacto.emailVerificado && (
              <div title="Email verificado en fuente oficial">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{cliente.analisisNecesidad}</p>
      </div>
      <div className="mt-4 self-start">
        <Link to={`/prospecto/${cliente.id}`} onClick={e => e.stopPropagation()} className="font-semibold text-blue-600 hover:text-blue-700">
            Ver Detalles &rarr;
        </Link>
      </div>
    </div>
  );
};