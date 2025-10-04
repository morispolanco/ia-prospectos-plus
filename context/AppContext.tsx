
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import type { PerfilUsuario, Servicio, EmailGenerado, ClientePotencial, LlamadaRegistrada } from '../types';

interface AppContextType {
  perfil: PerfilUsuario;
  servicios: Servicio[];
  emails: EmailGenerado[];
  prospectos: ClientePotencial[];
  llamadas: LlamadaRegistrada[];
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  setPerfil: (perfil: PerfilUsuario) => void;
  addServicio: (servicio: Omit<Servicio, 'id'>) => void;
  updateServicio: (servicio: Servicio) => void;
  removeServicio: (id: string) => void;
  addEmail: (email: Omit<EmailGenerado, 'id' | 'fecha'>) => void;
  removeEmails: (emailIds: string[]) => void;
  addProspectos: (prospectos: ClientePotencial[]) => void;
  removeProspectos: (prospectoIds: string[]) => void;
  getProspectoById: (id: string) => ClientePotencial | undefined;
  addLlamada: (llamada: Omit<LlamadaRegistrada, 'id' | 'fecha'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [perfil, setPerfilState] = useState<PerfilUsuario>(() => getInitialState<PerfilUsuario>('perfil', { nombre: '', email: '', paginaWeb: '' }));
  const [servicios, setServicios] = useState<Servicio[]>(() => getInitialState<Servicio[]>('servicios', []));
  const [emails, setEmails] = useState<EmailGenerado[]>(() => getInitialState<EmailGenerado[]>('emails', []));
  const [prospectos, setProspectosState] = useState<ClientePotencial[]>(() => {
    const initialProspectos = getInitialState<ClientePotencial[]>('prospectos', []);
    // Data migration for old items that might not have fechaAgregado
    return initialProspectos.map(p => ({
      ...p,
      fechaAgregado: p.fechaAgregado || new Date(0).toISOString() // Default to a very old date for sorting purposes
    }));
  });
  const [llamadas, setLlamadas] = useState<LlamadaRegistrada[]>(() => getInitialState<LlamadaRegistrada[]>('llamadas', []));
  const [googleClientId, setGoogleClientIdState] = useState<string>(() => getInitialState<string>('googleClientId', ''));


  useEffect(() => {
    localStorage.setItem('perfil', JSON.stringify(perfil));
  }, [perfil]);

  useEffect(() => {
    localStorage.setItem('servicios', JSON.stringify(servicios));
  }, [servicios]);

  useEffect(() => {
    localStorage.setItem('emails', JSON.stringify(emails));
  }, [emails]);
  
  useEffect(() => {
    localStorage.setItem('prospectos', JSON.stringify(prospectos));
  }, [prospectos]);

  useEffect(() => {
    localStorage.setItem('llamadas', JSON.stringify(llamadas));
  }, [llamadas]);

  useEffect(() => {
    localStorage.setItem('googleClientId', JSON.stringify(googleClientId));
  }, [googleClientId]);

  const setPerfil = (newPerfil: PerfilUsuario) => {
    setPerfilState(newPerfil);
  };

  const setGoogleClientId = (id: string) => {
    setGoogleClientIdState(id);
  };

  const addServicio = (servicio: Omit<Servicio, 'id'>) => {
    const newServicio = { ...servicio, id: Date.now().toString() };
    setServicios(prev => [...prev, newServicio]);
  };

  const updateServicio = (updatedServicio: Servicio) => {
    setServicios(prev => prev.map(s => (s.id === updatedServicio.id ? updatedServicio : s)));
  };

  const removeServicio = (id: string) => {
    setServicios(prev => prev.filter(s => s.id !== id));
  };
  
  const addEmail = (email: Omit<EmailGenerado, 'id' | 'fecha'>) => {
    const newEmail = { 
      ...email, 
      id: Date.now().toString(),
      fecha: new Date().toISOString()
    };
    setEmails(prev => [newEmail, ...prev]);
  };
  
  const removeEmails = (emailIds: string[]) => {
    setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
  };

  const addProspectos = (newProspectos: ClientePotencial[]) => {
    setProspectosState(prev => {
        const prospectosMap = new Map(prev.map(p => [p.id, p]));
        const now = new Date().toISOString();
        newProspectos.forEach(p => {
            const existingProspecto = prospectosMap.get(p.id);
            // Add the prospect with a new date if it's new, or keep the existing date if it's an update.
            prospectosMap.set(p.id, {
                ...p,
                // FIX: Cast existingProspecto to ClientePotencial to fix type inference issue.
                fechaAgregado: (existingProspecto as ClientePotencial)?.fechaAgregado || now,
            });
        });
        return Array.from(prospectosMap.values());
    });
  };

  const removeProspectos = (prospectoIds: string[]) => {
    setProspectosState(prev => prev.filter(p => !prospectoIds.includes(p.id)));
  };

  const getProspectoById = (id: string): ClientePotencial | undefined => {
    const allProspects = getInitialState<ClientePotencial[]>('prospectos', []);
    return allProspects.find(p => p.id === id);
  };

  const addLlamada = (llamada: Omit<LlamadaRegistrada, 'id' | 'fecha'>) => {
    const nuevaLlamada = {
      ...llamada,
      id: Date.now().toString(),
      fecha: new Date().toISOString()
    };
    setLlamadas(prev => [nuevaLlamada, ...prev]);
  };

  return (
    <AppContext.Provider value={{ perfil, setPerfil, servicios, addServicio, updateServicio, removeServicio, emails, addEmail, removeEmails, prospectos, addProspectos, removeProspectos, getProspectoById, llamadas, addLlamada, googleClientId, setGoogleClientId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
