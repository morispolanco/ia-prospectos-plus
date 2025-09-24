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
  gapiLoaded: boolean;
  gisLoaded: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';

export const GoogleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { googleClientId } = useAppContext();
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

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
        // Clean up scripts when component unmounts
        const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
        if (gapiScript) document.body.removeChild(gapiScript);
        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (gisScript) document.body.removeChild(gisScript);
    }
  }, []);

  useEffect(() => {
    if (gapiLoaded && gisLoaded && googleClientId && process.env.API_KEY) {
        // Init GAPI client
        window.gapi.client.init({
            apiKey: process.env.API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        });
        
        // Init GIS client
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: GMAIL_SCOPE,
            callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    window.gapi.client.setToken({ access_token: tokenResponse.access_token });
                    setIsGoogleSignedIn(true);
                }
            },
        });
        setTokenClient(client);
    }
  }, [gapiLoaded, gisLoaded, googleClientId]);

  const signIn = () => {
    if (!tokenClient) {
        alert("El ID de Cliente de Google no está configurado o la API de Google no se ha cargado. Por favor, configúralo en la página de Perfil.");
        return;
    }
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
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
    <GoogleAuthContext.Provider value={{ isGoogleSignedIn, signIn, signOut, gapiLoaded, gisLoaded }}>
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
