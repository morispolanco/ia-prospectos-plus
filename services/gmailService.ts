
declare global {
  interface Window {
    gapi: any;
  }
}

interface DraftDetails {
  to: string;
  subject: string;
  body: string;
}

export const createGmailDraft = async ({ to, subject, body }: DraftDetails): Promise<void> => {
  if (!window.gapi || !window.gapi.client || !window.gapi.client.gmail) {
    throw new Error('El cliente de la API de Gmail no está cargado.');
  }

  // RFC 2822 formatted email
  const emailLines = [
    `To: ${to}`,
    'Content-type: text/html;charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`, // Encode subject for special characters
    '',
    body.replace(/\n/g, '<br>'), // Simple newline to <br> for HTML email
  ];
  const email = emailLines.join('\r\n');

  // Base64 encode the email for the Gmail API (URL-safe variant)
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

  try {
    const response = await window.gapi.client.gmail.users.drafts.create({
      userId: 'me',
      resource: {
        message: {
          raw: base64EncodedEmail,
        },
      },
    });
    console.log('Draft created:', response);
  } catch (error: any) {
    console.error('Error creating Gmail draft:', error);
    // Handle specific auth errors if needed
    if (error.status === 401 || error.status === 403) {
      throw new Error('Permiso denegado. Por favor, vuelve a iniciar sesión con Google.');
    }
    throw new Error('No se pudo crear el borrador en Gmail. Revisa la consola para más detalles.');
  }
};