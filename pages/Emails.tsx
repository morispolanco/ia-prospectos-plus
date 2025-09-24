
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { EmailGenerado } from '../types';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { createGmailDraft } from '../services/gmailService';

const EmailCard: React.FC<{ email: EmailGenerado; isSelected: boolean; onSelect: (id: string) => void; }> = ({ email, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { asunto, cuerpo } = JSON.parse(email.cuerpo);
  const { isGoogleSignedIn, signIn, isReady } = useGoogleAuth();
  const [draftStatus, setDraftStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [draftMessage, setDraftMessage] = useState('');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cuerpo).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleCreateDraft = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGoogleSignedIn) {
        signIn();
        return;
    }
    setDraftStatus('loading');
    setDraftMessage('');
    try {
        await createGmailDraft({
            to: email.destinatario.contacto.email,
            subject: asunto,
            body: cuerpo,
        });
        setDraftStatus('success');
        setDraftMessage('¡Borrador creado en Gmail!');
    } catch (err) {
        setDraftStatus('error');
        setDraftMessage(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
        setTimeout(() => {
            setDraftStatus('idle');
            setDraftMessage('');
        }, 4000);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-all duration-300 relative ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'}`}>
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={() => onSelect(email.id)}
        role="button"
        aria-pressed={isSelected}
        aria-label={`Seleccionar email para ${email.destinatario.nombreEmpresa}`}
      ></div>
      
      <div className="p-6 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1 flex items-start">
              <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  aria-hidden="true"
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 mr-4 mt-1 flex-shrink-0"
              />
              <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PARA: {email.destinatario.contacto.email}</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{email.destinatario.nombreEmpresa}</h3>
                  <p className="text-blue-600 dark:text-blue-400">Asunto: {asunto}</p>
              </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(email.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className={`mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full z-10 relative ${
                isExpanded ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {isExpanded ? 'Ocultar' : 'Ver más'}
            </button>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-800/50 relative z-10">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Servicio Ofrecido:</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{email.servicio.nombre}</p>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Cuerpo del Email:</h4>
                <button onClick={handleCopy} className="px-3 py-1 text-xs font-semibold rounded-md flex items-center transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                    {isCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ¡Copiado!
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Copiar
                        </>
                    )}
                </button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
              <pre className="whitespace-pre-wrap font-sans">{cuerpo}</pre>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
                {draftMessage && (
                  <p className={`text-sm ${draftStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{draftMessage}</p>  
                )}
                <button 
                    onClick={handleCreateDraft}
                    disabled={draftStatus === 'loading' || (!isGoogleSignedIn && !isReady)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                    title={!isReady && !isGoogleSignedIn ? "Inicializando sistema de Google..." : "Crear un borrador de este email en tu cuenta de Gmail"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {draftStatus === 'loading' ? 'Creando...' : 'Crear Borrador en Gmail'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const Emails: React.FC = () => {
  const { emails, removeEmails } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectEmail = (id: string) => {
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
    if (emails.length === 0) return;
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  };

  const handleDeleteSelected = () => {
    removeEmails(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const escapeCsvCell = (cellData: string) => {
    const strCellData = String(cellData || '');
    if (strCellData.includes('"') || strCellData.includes(',') || strCellData.includes('\n')) {
      return `"${strCellData.replace(/"/g, '""')}"`;
    }
    return strCellData;
  };

  const handleExportToCSV = () => {
    const emailsToExport = selectedIds.size > 0
      ? emails.filter(e => selectedIds.has(e.id))
      : emails;

    if (emailsToExport.length === 0) return;

    const headers = [
      'Fecha', 'Empresa', 'Nombre Contacto', 'Email Contacto',
      'Servicio Ofrecido', 'Asunto', 'Cuerpo del Email'
    ];

    const rows = emailsToExport.map(email => {
      try {
        const { asunto, cuerpo } = JSON.parse(email.cuerpo);
        return [
          new Date(email.fecha).toLocaleString('es-ES'), email.destinatario.nombreEmpresa,
          email.destinatario.contacto.nombre, email.destinatario.contacto.email,
          email.servicio.nombre, asunto, cuerpo
        ].map(escapeCsvCell).join(',');
      } catch (e) {
        console.error("Error parsing email body for CSV export:", e);
        return '';
      }
    });

    const csvContent = [
      headers.join(','), ...rows.filter(row => row)
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_emails_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Emails Generados</h2>
      </div>
      {emails.length > 0 ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-gray-800 dark:text-white">
                <span>{selectedIds.size} de {emails.length} seleccionados</span>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                {selectedIds.size === emails.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportToCSV}
                disabled={emails.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                Exportar {selectedIds.size > 0 ? `${selectedIds.size} Seleccionado(s)` : 'Todo'}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                Eliminar Seleccionados
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {emails.map(email => (
              <EmailCard key={email.id} email={email} isSelected={selectedIds.has(email.id)} onSelect={handleSelectEmail} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400">No has generado ningún correo electrónico todavía.</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Ve a la página de 'Búsqueda' para encontrar prospectos y crear emails.</p>
        </div>
      )}
    </div>
  );
};