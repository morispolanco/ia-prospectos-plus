
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useAppContext } from './AppContext';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleAuthContextType {
  isGoogleSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  isReady: boolean;
  error: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';

export const GoogleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { googleClientId } = useAppContext();
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [gapiClientReady, setGapiClientReady] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    scriptGapi.onload = () => window.gapi.load('client', () => setGapiLoaded(true));
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true;
    scriptGis.defer = true;
    scriptGis.onload = () => setGisLoaded(true);
    document.body.appendChild(scriptGis);

    return () => {
        const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
        if (gapiScript) document.body.removeChild(gapiScript);
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (gisScript) document.body.removeChild(gisScript);
    }
  }, []);

  // Effect for initializing GAPI client (loads Gmail API definition)
  useEffect(() => {
    if (gapiLoaded && googleClientId && process.env.API_KEY) {
      const initializeGapiClient = async () => {
        try {
          await window.gapi.client.init({
            apiKey: process.env.API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
          });
          setGapiClientReady(true);
          setError(null);
        } catch (err: any) {
          console.error("Error initializing GAPI client:", err);
          setError("No se pudo inicializar el cliente de Google. Revisa la consola.");
        }
      };
      initializeGapiClient();
    }
  }, [gapiLoaded, googleClientId]);

  // Effect for initializing GIS token client (handles OAuth)
  useEffect(() => {
    if (gisLoaded && googleClientId) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: GMAIL_SCOPE,
            callback: (tokenResponse: any) => {
                if (tokenResponse.error) {
                    console.error("Google auth error:", tokenResponse);
                    setError(`Error de autenticación: ${tokenResponse.error_description || tokenResponse.error}`);
                    setIsGoogleSignedIn(false);
                    return;
                }
                if (tokenResponse && tokenResponse.access_token) {
                    window.gapi.client.setToken({ access_token: tokenResponse.access_token });
                    setIsGoogleSignedIn(true);
                    setError(null);
                }
            },
        });
        setTokenClient(client);
      } catch (err: any) {
        console.error("Error initializing GIS client:", err);
        setError("No se pudo inicializar el sistema de autenticación de Google.");
      }
    }
  }, [gisLoaded, googleClientId]);

  const isReady = gapiClientReady && !!tokenClient;

  const signIn = () => {
    if (!isReady || !tokenClient) {
        let message = "El sistema de Google no está listo. ";
        if (!googleClientId) message += "Por favor, configura tu Google Client ID en el Perfil.";
        else message += "Por favor, espera un momento o recarga la página.";
        alert(message);
        setError(message);
        return;
    }
    
    if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
          window.gapi.client.setToken(null);
          setIsGoogleSignedIn(false);
      });
    }
  };

  return (
    <GoogleAuthContext.Provider value={{ isGoogleSignedIn, signIn, signOut, isReady, error }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};
