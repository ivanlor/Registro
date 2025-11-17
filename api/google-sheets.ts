import type { TimeRecord } from '../types';

// URL del script de Google. Reemplaza esto con tu URL de despliegue.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygt8_3nGfCvNh4jH_89GmbEZ-ObwdB8V1V1dDm5NQWg2dAULlXUc_oyNe2bi3ukk0y/exec';

interface ScriptResponse {
  result: 'success' | 'error';
  message?: string;
  data?: any;
}

const postToScript = async (payload: object): Promise<ScriptResponse> => {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    // NO 'no-cors' mode
  });

  if (!response.ok) {
    // Captura errores de red o HTTP (ej. 500, 404)
    throw new Error(`Error en la comunicación con el servidor: ${response.statusText} (${response.status})`);
  }

  // Google Apps Script a veces envuelve la respuesta en una redirección,
  // por lo que el `Content-Type` puede ser 'text/plain'.
  // Intentamos parsear como JSON, y si falla, mostramos el texto.
  const textResponse = await response.text();
  try {
    return JSON.parse(textResponse) as ScriptResponse;
  } catch (e) {
    console.error("La respuesta del script no es un JSON válido:", textResponse);
    throw new Error("Respuesta inesperada del servidor de Google. Revisa la consola para más detalles.");
  }
};


export const addRecordToSheet = (record: TimeRecord): Promise<ScriptResponse> => {
  const registrationDate = new Date(record.timestamp);
  const formattedRegistrationDate = `${registrationDate.getDate()}-${registrationDate.getMonth() + 1}-${registrationDate.getFullYear()} ${String(registrationDate.getHours()).padStart(2, '0')}:${String(registrationDate.getMinutes()).padStart(2, '0')}`;
  
  const payload = {
    action: 'add',
    data: {
      "ID": record.id,
      "F. Inicio": record.startDate,
      "F. Fin": record.endDate,
      "H. Inicio": record.startTime,
      "H. Fin": record.endTime,
      "Actuación": record.description,
      "Horas": record.calculatedHours,
      "Nombre": record.name,
      "Observaciones": record.observations || '',
      "F. Registro": formattedRegistrationDate,
    }
  };
  return postToScript(payload);
};


export const deleteRecordFromSheet = (recordId: string): Promise<ScriptResponse> => {
  const payload = {
    action: 'delete',
    data: {
      id: recordId,
    }
  };
  return postToScript(payload);
};
