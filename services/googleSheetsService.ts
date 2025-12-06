
import type { FormData } from '../types';

/**
 * Sends form data to a Google Apps Script web app endpoint.
 * The script is responsible for finding the correct cells in the Google Sheet
 * and updating them with the provided data.
 *
 * @param data The form data to be submitted.
 * @param appsScriptUrl The URL of the deployed Google Apps Script web app.
 * @param sheetName The name of the sheet to write data to.
 * @param googleSheetUrl The URL of the target Google Sheet.
 * @returns A promise that resolves with a success message or rejects with an error.
 */
export const submitData = async (data: FormData, appsScriptUrl: string, sheetName: string, googleSheetUrl: string): Promise<{ message: string }> => {
    if (!googleSheetUrl) {
        throw new Error('La URL de Google Sheet no está configurada.');
    }
    if (!appsScriptUrl || !appsScriptUrl.startsWith('https://script.google.com/macros/s/')) {
        throw new Error('La URL de Google Apps Script no es válida o no está configurada.');
    }
    if (!sheetName) {
        throw new Error('El nombre de la hoja de cálculo no puede estar vacío.');
    }

    // Enviamos googleSheetUrl porque el script del usuario lo espera con ese nombre
    const payload = { ...data, sheetName, googleSheetUrl };

    try {
        const response = await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });
        
        const responseText = await response.text();

        // Centralized check for the most common and specific error from the script.
        if (responseText.includes("Hoja no encontrada") || responseText.includes("URL de Google Sheet")) {
            throw new Error(`Error desde Google: ${responseText.trim()}.`);
        }
        if (responseText.includes("Document") && responseText.includes("is missing")) {
             throw new Error("Error de acceso: La hoja de cálculo no existe o no se tiene acceso. Verifica la URL configurada.");
        }

        if (!response.ok) {
            console.error("Error response from server:", responseText);
            throw new Error(`Error del servidor (${response.status}). Mensaje: ${responseText}`);
        }
        
        // If the response is OK, we expect a JSON object.
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON response:", responseText);
            throw new Error(`Respuesta inesperada del servidor (no es JSON válido): ${responseText}`);
        }

        if (result.status === 'error') {
            throw new Error(result.message || 'Error desconocido desde Google Apps Script.');
        }

        // Use the success message directly from the script's response
        return { message: result.message };

    } catch (error) {
        console.error('Error submitting data:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error('Error de red o CORS. Revisa: 1) La URL del script es correcta. 2) El script está implementado para acceso de "Cualquier persona".');
        }
        throw error;
    }
};
