
import type { FormData } from '../types';

/**
 * Formats values to match Google Sheets requirements.
 * - Dates: YYYY-MM-DD -> d/m/yyyy (e.g., 2025-12-08 -> 8/12/2025)
 * - Decimals: Replaces dot with comma (e.g., 2.5 -> 2,5)
 * - Arrays: Joins with comma (e.g., ['A', 'B'] -> "A, B")
 */
const formatValueForSheets = (value: any): string | number => {
    if (value === null || value === undefined) return '';
    
    // Handle Arrays (Multi-select / Checkbox groups)
    if (Array.isArray(value)) {
        return value.filter(v => v !== '').join(', ');
    }

    const strVal = String(value);

    // 1. Date Format: YYYY-MM-DD -> d/m/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
        const [year, month, day] = strVal.split('-');
        return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
    }

    // 2. Decimal Format: dot to comma
    if (/^-?\d+\.\d+$/.test(strVal)) {
        return strVal.replace('.', ',');
    }

    return value;
};

/**
 * Sends form data to a Google Apps Script web app endpoint.
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

    // Apply formatting to all data fields
    const formattedData: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(data)) {
        formattedData[key] = formatValueForSheets(value);
    }

    const payload = { ...formattedData, sheetName, googleSheetUrl };

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

        if (responseText.includes("Hoja no encontrada") || responseText.includes("URL de Google Sheet")) {
            throw new Error(`Error desde Google: ${responseText.trim()}.`);
        }
        if (responseText.includes("Document") && responseText.includes("is missing")) {
             throw new Error("Error de acceso: La hoja de cálculo no existe o no se tiene acceso. Verifica la URL configurada.");
        }

        if (!response.ok) {
            throw new Error(`Error del servidor (${response.status}). Mensaje: ${responseText}`);
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Respuesta inesperada del servidor (no es JSON válido): ${responseText}`);
        }

        if (result.status === 'error') {
            throw new Error(result.message || 'Error desconocido desde Google Apps Script.');
        }

        return { message: 'Datos guardados correctamente' };

    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error('Error de conexión. IMPORTANTE: Si has actualizado el código del script, debes crear una "NUEVA IMPLEMENTACIÓN" (Manage Deployments -> New Version). Si no, el cambio no se aplica.');
        }
        throw error;
    }
};
