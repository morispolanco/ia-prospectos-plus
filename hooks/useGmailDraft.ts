import { useState } from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { createGmailDraft } from '../services/gmailService';

interface DraftDetails {
  to: string;
  subject: string;
  body: string;
}

type DraftStatus = 'idle' | 'loading' | 'success' | 'error';

export const useGmailDraft = () => {
  const { isGoogleSignedIn, signIn, isReady } = useGoogleAuth();
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [message, setMessage] = useState('');

  const createDraft = async (details: DraftDetails) => {
    if (!isReady) {
        setMessage("El sistema de Google no está listo. Intenta de nuevo.");
        setStatus('error');
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 4000);
        return;
    }

    if (!isGoogleSignedIn) {
        signIn();
        return;
    }

    setStatus('loading');
    setMessage('');
    try {
        await createGmailDraft(details);
        setStatus('success');
        setMessage('¡Borrador creado en Gmail!');
    } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error desconocido al crear el borrador.');
    } finally {
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 4000);
    }
  };

  return { createDraft, status, message, isReady, isGoogleSignedIn };
};
