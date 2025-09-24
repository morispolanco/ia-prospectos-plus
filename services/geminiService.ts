
import { GoogleGenAI } from "@google/genai";
import type { PerfilUsuario, Servicio, ClientePotencial } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const buscarClientes = async (servicio: Servicio, sector: string, ubicacion: string): Promise<ClientePotencial[]> => {
  try {
    const systemInstruction = "Eres una API de búsqueda de prospectos B2B. Tu única función es devolver datos en formato JSON. Nunca incluyas texto explicativo, saludos o cualquier otra cosa fuera del JSON solicitado.";

    const prompt = `
    Realiza una búsqueda para encontrar hasta 10 clientes potenciales del sector '${sector}' en '${ubicacion}' que necesiten el servicio: '${servicio.nombre}'.

    REGLAS ESTRICTAS:
    1.  FILTRADO OBLIGATORIO: Devuelve ÚNICAMENTE prospectos con una 'probabilidadContratacion' superior a 80.
    2.  DATOS COMPLETOS: Para cada empresa, usa Google Search para encontrar la siguiente información. Todos los campos son OBLIGATORIOS.
        - Un contacto relevante (gerente, director) con su nombre, cargo y email.
        - El número de teléfono de la empresa.
        - La dirección completa de la oficina principal.
        - Una calificación promedio y el número de reseñas (si están disponibles en fuentes como Google Maps). Si no hay, usa 0.
    3.  BÚSQUEDA DE CONTACTOS: Para encontrar los contactos más relevantes y actuales, busca en múltiples fuentes, no solo LinkedIn. Considera Google Maps, redes sociales de la empresa, y directorios profesionales (ej: colegios de abogados, médicos, etc.). El objetivo es encontrar a la persona con mayor probabilidad de contratar el servicio. IMPORTANTE: Ignora y descarta cualquier correo electrónico que comience con 'info'.
    4.  ORDEN: Ordena el resultado final de mayor a menor 'probabilidadContratacion'.
    5.  FORMATO DE SALIDA: Tu respuesta DEBE ser EXCLUSIVAMENTE un array JSON válido. No añadas texto introductorio, explicaciones, ni marcadores de código como \`\`\`json. La respuesta debe empezar con '[' y terminar con ']'.

    La estructura de cada objeto JSON debe ser:
    {
      "id": "string (un UUID v4 único para cada prospecto)",
      "nombreEmpresa": "string",
      "paginaWeb": "string",
      "contacto": { "nombre": "string", "cargo": "string", "email": "string", "telefono": "string" },
      "ubicacion": "string (ciudad/país, ej: '${ubicacion}')",
      "sector": "string (ej: '${sector}')",
      "direccionCompleta": "string",
      "analisisNecesidad": "string (un análisis breve de por qué necesitan el servicio)",
      "probabilidadContratacion": "number (entre 81 y 100)",
      "calificacion": { "puntuacion": "number", "reseñas": "number" }
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          tools: [{googleSearch: {}}],
        },
    });

    let jsonText = response.text.trim();
    
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else {
      console.error("No se encontró un array JSON válido en la respuesta:", response.text);
      throw new Error("La respuesta del modelo no contenía un array JSON válido. La respuesta fue: " + response.text.substring(0, 100) + "...");
    }
    
    const clientes = JSON.parse(jsonText) as ClientePotencial[];
    return clientes;
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    if (error instanceof SyntaxError) {
      console.error("Respuesta recibida no es JSON válido.");
      throw new Error("La respuesta del modelo no tuvo un formato JSON válido. Intenta ajustar la búsqueda.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("No se pudieron obtener los prospectos. Inténtalo de nuevo.");
  }
};

export const generarEmail = async (cliente: ClientePotencial, servicio: Servicio, perfil: PerfilUsuario): Promise<string> => {
  try {
    const systemInstruction = "Eres una API de redacción de correos. Tu única función es devolver un objeto JSON con las claves 'asunto' y 'cuerpo'. Nunca escribas nada fuera del objeto JSON.";

    const prompt = `
    Tu tarea es redactar un borrador de correo electrónico B2B altamente personalizado en español.

    **PASO 1: INVESTIGACIÓN**
    Usa Google Search para investigar a la empresa '${cliente.nombreEmpresa}' (sitio web: ${cliente.paginaWeb}). Busca noticias recientes, publicaciones de blog, o secciones de 'sobre nosotros' para entender sus objetivos, desafíos o proyectos actuales. Tu meta es encontrar un "gancho" o necesidad específica que no esté explícitamente en el análisis previo.

    **PASO 2: REDACCIÓN DEL CORREO**
    Basado en tu investigación y la información proporcionada, redacta el correo.

    **Información del destinatario:**
    - Empresa: ${cliente.nombreEmpresa}
    - Contacto: ${cliente.contacto.nombre} (${cliente.contacto.cargo})
    - Análisis previo de su necesidad: ${cliente.analisisNecesidad}

    **Información del remitente (mi perfil):**
    - Nombre: ${perfil.nombre}
    - Email: ${perfil.email}
    - Web: ${perfil.paginaWeb}
    - Mi servicio: ${servicio.nombre}
    - Descripción del servicio: ${servicio.descripcion}

    **REGLAS ESTRICTAS PARA EL CORREO:**
    1.  **Asunto:** Corto, intrigante y muy personalizado, haciendo referencia a tu investigación. (ej: "Sobre [tema encontrado en investigación] en ${cliente.nombreEmpresa}").
    2.  **Cuerpo:**
        -   Saludo: "Estimado/a ${cliente.contacto.nombre}:".
        -   Introducción (Párrafo 1): Comienza mencionando algo específico que encontraste en tu investigación. Demuestra que has hecho tu tarea. Por ejemplo: "He seguido de cerca el lanzamiento de [producto/iniciativa] y estoy impresionado con..."
        -   Conexión y Solución (Párrafo 2): Conecta tu hallazgo con una posible necesidad o desafío que ellos puedan tener, y presenta tu servicio ('${servicio.nombre}') como la solución directa a ESE problema específico. Sé muy concreto. Por ejemplo: "Dado su enfoque en [objetivo de la empresa], he pensado que la gestión de [área relacionada con tu servicio] podría ser un desafío. Nuestro servicio, [nombre del servicio], ayuda a empresas como la suya a [beneficio clave relacionado con su necesidad]".
        -   Llamada a la acción (Párrafo 3): Clara y de bajo compromiso (ej: "¿Le parecería bien una breve llamada de 15 minutos la próxima semana para explorar cómo podríamos ayudarles?").
        -   Despedida y Firma: Finaliza el correo con "Atentamente,". Justo debajo, DEBES incluir la siguiente firma, con cada elemento en una nueva línea:
            ${perfil.nombre}
            ${perfil.email}
            ${perfil.paginaWeb}
    
    **FORMATO DE SALIDA OBLIGATORIO:**
    Tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON válido. No incluyas texto, explicaciones o marcadores de formato. La respuesta debe empezar con '{' y terminar con '}'.
    
    La estructura JSON debe ser:
    {
      "asunto": "string",
      "cuerpo": "string"
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            tools: [{googleSearch: {}}],
        }
    });
    
    let jsonText = response.text.trim();
    
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else {
        console.error("No se encontró un objeto JSON válido en la respuesta:", response.text);
        throw new Error("La respuesta del modelo para el email no contenía un objeto JSON válido.");
    }

    return jsonText;
  } catch (error) {
    console.error("Error al generar el email:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("No se pudo generar el correo. Inténtalo de nuevo.");
  }
};