
import React, { useState } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

export const ScriptHelp: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);

    const codeSnippet = `/**
 * CÓDIGO PARA GOOGLE APPS SCRIPT
 * Copia y pega TODO este contenido en el archivo "Código.gs" de tu proyecto de Google Apps Script.
 */

function doPost(e) {
  try {
    // 1. Verificar si llegan datos
    if (!e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos (postData).");
    }

    // 2. Leer los datos enviados desde la web
    var data = JSON.parse(e.postData.contents);
    var sheetName = data.sheetName;
    var googleSheetUrl = data.googleSheetUrl;

    if (!googleSheetUrl) throw new Error("URL de Google Sheet no recibida.");
    if (!sheetName) throw new Error("Nombre de la hoja (sheetName) no recibido.");

    // 3. Abrir la hoja de cálculo por URL
    var spreadsheet = SpreadsheetApp.openByUrl(googleSheetUrl);
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('No se pudo encontrar la hoja "' + sheetName + '". Verifica el nombre en las pestañas de tu Google Sheet.');
    }

    // 4. Preparar la fila nueva según la hoja seleccionada
    var newRow = [];
    var timestamp = new Date(); // Fecha y hora actual del registro

    if (sheetName === 'Rutina') {
      // Orden sugerido: Fecha, Punto, Turbidez, pH, Cloro, Color, Olor, Sabor, Operario, Observaciones
      newRow = [
        data.date || '',
        data.punto_de_muestreo || '',
        data.turbidez || '',
        data.ph || '',
        data.cloro || '',
        data.color || '',
        data.olor || '',
        data.sabor || '',
        data.operario || '',
        data.observaciones || ''
      ];

    } else if (sheetName === 'Operacional') {
      // Orden sugerido: Fecha, Hora, pH, Turbidez, Cloro, Operario, Observaciones
      newRow = [
        data.date || '',
        data.hora || '',
        data.ph || '',
        data.turbidez || '',
        data.cloro || '',
        data.operario || '',
        data.observaciones || ''
      ];

    } else if (sheetName === 'Bombeos') {
      // Orden EXACTO según tu hoja de cálculo:
      // A: Fecha, B: Bombeo, C: Total Bomba 1, D: Horas Bomba 1, E: Total Bomba 2, F: Horas Bomba 2, G: Observaciones
      newRow = [
        data.date || '',
        data.bombeo || '',
        data.total_bomba_1 || '',
        data.horas_bomba_1 || '',
        data.total_bomba_2 || '',
        data.horas_bomba_2 || '',
        data.observaciones || ''
      ];

    } else if (sheetName === 'Registro_horario') {
      // Campos esperados: fecha_inicio, fecha_fin, hora_inicio, hora_fin, actuacion, horas, nombre, observaciones
      newRow = [
        data.fecha_inicio || '',
        data.fecha_fin || '',
        data.hora_inicio || '',
        data.hora_fin || '',
        data.actuacion || '',
        data.horas || '', // CORREGIDO: Ahora coincide con el campo 'horas' del formulario
        data.nombre || '',
        data.observaciones || '',
        timestamp // Fecha registro
      ];

    } else if (sheetName === 'Vacaciones') {
      // Campos esperados: nombre, apellidos, fecha_inicio, fecha_fin, dias
      newRow = [
        data.nombre || '',
        data.apellidos || '',
        data.fecha_inicio || '',
        data.fecha_fin || '',
        data.dias || '',
        timestamp // Fecha registro
      ];

    } else {
      throw new Error('La hoja "' + sheetName + '" no está configurada en el script.');
    }

    // 5. Añadir la fila al final de la hoja
    sheet.appendRow(newRow);

    // 6. Responder éxito
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: '¡Datos guardados con éxito en la hoja "' + sheetName + '"!'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Manejo de errores
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Error en Google Apps Script: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Ayuda con Google Apps Script</h3>
            <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-100 dark:bg-slate-800 dark:text-blue-300 border border-blue-400 dark:border-blue-600" role="alert">
                <p className="font-bold text-base">Instrucciones OBLIGATORIAS:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Copia el código de abajo (botón "Copiar").</li>
                    <li>Ve a tu proyecto en <a href="https://script.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">Google Apps Script</a>.</li>
                    <li>Borra <strong>todo</strong> el contenido del archivo <code>Código.gs</code> y pega el nuevo.</li>
                    <li>Pulsa Guardar (💾).</li>
                    <li className="font-bold text-red-600 dark:text-red-400">IMPORTANTE: Pulsa "Implementar" &rarr; "Gestionar implementaciones" &rarr; "Editar" (lápiz) &rarr; Versión "Nueva" &rarr; "Hecho".</li>
                    <li>Si no creas una nueva versión, <strong>los cambios no se aplicarán</strong> y seguirá dando error.</li>
                    <li>Asegúrate de que "Quién tiene acceso" sigue siendo "Cualquier usuario".</li>
                </ol>
            </div>


            <div className="relative bg-slate-800 rounded-md overflow-hidden">
                 <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
                    aria-label="Copiar código"
                >
                    {isCopied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <ClipboardIcon className="h-4 w-4" />}
                    {isCopied ? 'Copiado' : 'Copiar'}
                </button>
                <pre className="p-4 rounded-md overflow-x-auto text-sm">
                    <code className="font-mono text-slate-200">
                        {codeSnippet}
                    </code>
                </pre>
            </div>
        </div>
    );
};
