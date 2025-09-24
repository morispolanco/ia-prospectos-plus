
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generarEmail } from '../services/geminiService';
import type { ClientePotencial, Servicio, LlamadaRegistrada } from '../types';
import { Spinner } from '../components/Spinner';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { createGmailDraft } from '../services/gmailService';

// --- Helper Components defined in-file for simplicity ---

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; isLink?: boolean }> = ({ icon, label, value, isLink }) => (
  <div className="grid grid-cols-[20px,1fr] items-start gap-x-4">
    <div className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true">{icon}</div>
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 dark:text-white ${isLink ? 'text-blue-600 dark:text-blue-400 hover:underline' : ''}`}>{value}</dd>
    </div>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl ${className}`}>
    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="px-4 py-5 sm:p-6">{children}</div>
  </div>
);

const CircularProgress: React.FC<{ percentage: number; circleClassName?: string; }> = ({ percentage, circleClassName = "text-green-500" }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle className="text-gray-200 dark:text-gray-700" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
        <circle
          className={circleClassName}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-gray-800 dark:text-white">{percentage}%</span>
      </div>
    </div>
  );
};

const EmailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cliente: ClientePotencial;
  servicio: Servicio;
}> = ({ isOpen, onClose, cliente, servicio }) => {
  const { perfil, addEmail } = useAppContext();
  const [emailContent, setEmailContent] = useState({ asunto: '', cuerpo: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { isGoogleSignedIn, signIn, isReady } = useGoogleAuth();
  const [draftStatus, setDraftStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [draftMessage, setDraftMessage] = useState('');

  const handleGenerateEmail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await generarEmail(cliente, servicio, perfil);
      const parsedResult = JSON.parse(result);
      setEmailContent(parsedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = () => {
    addEmail({
      destinatario: cliente,
      servicio,
      cuerpo: JSON.stringify(emailContent),
    });
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent.cuerpo).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleCreateDraft = async () => {
    if (!isGoogleSignedIn) {
        signIn();
        return;
    }
    setDraftStatus('loading');
    setDraftMessage('');
    try {
        await createGmailDraft({
            to: cliente.contacto.email,
            subject: emailContent.asunto,
            body: emailContent.cuerpo,
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

  React.useEffect(() => {
    // Reset state when modal opens for a new client
    if (isOpen) {
        setEmailContent({ asunto: '', cuerpo: '' });
        setError('');
        setIsLoading(false);
        setIsCopied(false);
        setDraftStatus('idle');
        setDraftMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Generar Email para {cliente.nombreEmpresa}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <Spinner message="Generando email..." />
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : emailContent.cuerpo ? (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">Asunto:</label>
                <input type="text" value={emailContent.asunto} onChange={(e) => setEmailContent(prev => ({ ...prev, asunto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-700 dark:text-gray-300">Cuerpo:</label>
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
                <textarea value={emailContent.cuerpo} onChange={(e) => setEmailContent(prev => ({ ...prev, cuerpo: e.target.value }))} rows={12} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm" />
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Haz clic para generar un borrador de correo personalizado para este cliente.</p>
                <button onClick={handleGenerateEmail} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Generar Borrador</button>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-between items-center">
            <div className="flex-grow">
                 {draftMessage && (
                  <p className={`text-sm ${draftStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{draftMessage}</p>  
                )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
              {emailContent.cuerpo && !isLoading && (
                  <button 
                    onClick={handleCreateDraft} 
                    disabled={draftStatus === 'loading' || (!isGoogleSignedIn && !isReady)} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    title={!isReady && !isGoogleSignedIn ? "Inicializando sistema de Google..." : "Crear un borrador de este email en tu cuenta de Gmail"}
                  >
                      {draftStatus === 'loading' ? 'Creando...' : 'Crear en Gmail'}
                  </button>
              )}
              <button onClick={handleSaveEmail} disabled={!emailContent.cuerpo || isLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Guardar Email</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const CallModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  prospectoId: string;
  prospectoNombre: string;
}> = ({ isOpen, onClose, prospectoId, prospectoNombre }) => {
  const { addLlamada } = useAppContext();
  const [resultado, setResultado] = useState<LlamadaRegistrada['resultado']>('Contacto realizado');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notas.trim()) {
        setError("Por favor, añade algunas notas.");
        return;
    }
    addLlamada({
        prospectoId,
        resultado,
        notas,
    });
    setNotas('');
    setError('');
    setResultado('Contacto realizado');
    onClose();
  };
  
  React.useEffect(() => {
    if (isOpen) {
        setNotas('');
        setError('');
        setResultado('Contacto realizado');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Registrar Llamada a {prospectoNombre}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
            <div>
                <label htmlFor="resultado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resultado de la llamada</label>
                <select id="resultado" value={resultado} onChange={e => setResultado(e.target.value as LlamadaRegistrada['resultado'])} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Contacto realizado</option>
                    <option>Interesado</option>
                    <option>Seguimiento</option>
                    <option>Buzón de voz</option>
                    <option>No Interesado</option>
                    <option>Otro</option>
                </select>
            </div>
             <div>
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
                <textarea id="notas" value={notas} onChange={e => setNotas(e.target.value)} rows={5} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Añade detalles sobre la conversación..." required/>
                 {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Registro</button>
        </div>
      </form>
    </div>
  );
};


// --- Main Page Component ---

export const ProspectoDetalle: React.FC = () => {
    const { prospectoId } = useParams<{ prospectoId: string }>();
    const { getProspectoById, emails, servicios, llamadas } = useAppContext();
    const navigate = useNavigate();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);

    const prospecto = useMemo(() => prospectoId ? getProspectoById(prospectoId) : undefined, [prospectoId, getProspectoById]);

    const prospectoEmails = useMemo(() => 
        emails.filter(email => email.destinatario.id === prospectoId), 
        [emails, prospectoId]
    );

    const prospectoLlamadas = useMemo(() => 
        llamadas.filter(llamada => llamada.prospectoId === prospectoId)
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
        [llamadas, prospectoId]
    );

    const servicioOfrecido = servicios.length > 0 ? servicios[0] : undefined;

    if (!prospecto) {
        return <div className="text-center p-10">Prospecto no encontrado. <button onClick={() => navigate('/')} className="text-blue-600">Volver a la búsqueda</button></div>;
    }

    const getProbabilidadInfo = (percentage: number) => {
        if (percentage > 89) {
            return {
                texto: 'Probabilidad Alta',
                colorClass: 'text-green-600 dark:text-green-400',
                circleClass: 'text-green-500'
            };
        }
        return {
            texto: 'Probabilidad Media',
            colorClass: 'text-yellow-600 dark:text-yellow-400',
            circleClass: 'text-yellow-500'
        };
    };

    const probabilidadInfo = getProbabilidadInfo(prospecto.probabilidadContratacion);
    
    const getResultadoColor = (resultado: LlamadaRegistrada['resultado']) => {
        switch (resultado) {
          case 'Interesado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
          case 'Seguimiento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
          case 'Contacto realizado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
          case 'Buzón de voz': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
          case 'No Interesado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };
    
    return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Volver
            </button>
        </div>

        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacto de {prospecto.nombreEmpresa}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Información detallada del prospecto</p>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    Editar
                </button>
                 <button onClick={() => setIsEmailModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 2.5l7.997 3.384A2 2 0 0019 7.584V15a2 2 0 01-2 2H3a2 2 0 01-2-2V7.584c0-.897.523-1.683 1.28-1.97l.001-.001.002-.001zM11 11.25a1 1 0 10-2 0v2.5a1 1 0 102 0v-2.5z" /><path d="M10 18a2 2 0 100-4 2 2 0 000 4z" /></svg>
                    Generar Email
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Información Básica">
                   <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} label="Nombre de Contacto" value={prospecto.contacto.nombre} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3h-15A2.25 2.25 0 002.25 5.25v18zm13.5-9a1.5 1.5 0 01-3 0V6a1.5 1.5 0 013 0v6z" /></svg>} label="Empresa" value={prospecto.nombreEmpresa} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" /></svg>} label="Email" value={prospecto.contacto.email} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>} label="Teléfono" value={prospecto.contacto.telefono} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} label="Ubicación" value={prospecto.ubicacion} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5 0-2.268-2.268M6 20.25h4.5m-7.5-3.75h4.5m-3.75-3.75h7.5m-11.25-3.75h11.25m-3.75-3.75h7.5m-7.5 3.75h3.75m-3.75 3.75h3.75m4.5-11.25v15m-3.75-15v3.75" /></svg>} label="Sector" value={<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{prospecto.sector}</span>} />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-5.496A8.959 8.959 0 002.25 12c0 .778.099 1.533.284 2.253m18.232-2.253A11.953 11.953 0 0012 10.5" /></svg>} label="Sitio Web" value={<a href={prospecto.paginaWeb} target="_blank" rel="noopener noreferrer">{prospecto.paginaWeb}</a>} isLink />
                        <InfoItem icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21.75h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>} label="Dirección Completa" value={prospecto.direccionCompleta} />
                    </dl>
                </Card>
                <Card title="Análisis del Negocio">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Análisis de Necesidades</h4>
                            <div className="mt-2 p-4 bg-blue-50 dark:bg-gray-700/50 border-l-4 border-blue-400 text-blue-800 dark:text-blue-200 rounded-r-lg">
                                <p>{prospecto.analisisNecesidad}</p>
                            </div>
                        </div>
                    </div>
                </Card>
                <Card title="Historial de Llamadas">
                    {prospectoLlamadas.length > 0 ? (
                        <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {prospectoLlamadas.map(llamada => (
                                <li key={llamada.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultadoColor(llamada.resultado)}`}>{llamada.resultado}</span>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(llamada.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 mt-2">{llamada.notas}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay llamadas registradas</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Registra el resultado de tus llamadas.</p>
                            <div className="mt-6">
                                <button onClick={() => setIsCallModalOpen(true)} type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    Registrar Primera Llamada
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
                <Card title="Historial de Emails">
                    {prospectoEmails.length > 0 ? (
                        <ul className="space-y-4">
                            {prospectoEmails.slice(0, 3).map(email => {
                                const { asunto } = JSON.parse(email.cuerpo);
                                return (
                                <li key={email.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <p className="font-semibold">{asunto}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enviado el: {new Date(email.fecha).toLocaleDateString()}</p>
                                </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay emails generados</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Empieza por generar el primer email.</p>
                            <div className="mt-6">
                                <button onClick={() => setIsEmailModalOpen(true)} type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    Generar Primer Email
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card title="Probabilidad de Contratación" className="flex flex-col items-center">
                    <CircularProgress percentage={prospecto.probabilidadContratacion} circleClassName={probabilidadInfo.circleClass} />
                    <p className={`mt-4 font-semibold ${probabilidadInfo.colorClass}`}>{probabilidadInfo.texto}</p>
                </Card>
                <Card title="Calificación del Negocio">
                    <div className="flex flex-col items-center text-center">
                         <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            <span className="text-4xl font-bold ml-2 text-gray-800 dark:text-white">{prospecto.calificacion.puntuacion.toFixed(1)}</span>
                         </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Basado en {prospecto.calificacion.reseñas} reseñas</p>
                    </div>
                </Card>
                 <Card title="Acciones Rápidas">
                    <div className="space-y-3">
                         <button onClick={() => setIsEmailModalOpen(true)} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                             Generar Email
                         </button>
                         <button onClick={() => setIsCallModalOpen(true)} className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                             Registrar Llamada
                         </button>
                          <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                             Ver Todos los Emails
                         </button>
                         <a href={prospecto.paginaWeb} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                             Visitar Sitio Web
                         </a>
                    </div>
                 </Card>
            </div>
        </div>
      </div>
      {servicioOfrecido && (
          <EmailModal 
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            cliente={prospecto}
            servicio={servicioOfrecido}
          />
      )}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        prospectoId={prospecto.id}
        prospectoNombre={prospecto.nombreEmpresa}
      />
    </>
    );
};
