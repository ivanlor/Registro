import React, { useState } from 'react';
import type { TimeRecord, NewTimeRecord } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TimeRecordForm } from './components/TimeRecordForm';
import { RecentRecordsTable } from './components/RecentRecordsTable';
import { LogoIcon } from './components/icons';

// La URL de la Web App se define aquí como una constante.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwHT_Nmg3HKyzbKN18fl_dWBMMGnWcikrk10xP6rTbZnl7BFuGqO_srByO3rO50Vzhf/exec';

export default function App() {
  const [records, setRecords] = useLocalStorage<TimeRecord[]>('timeRecords', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (newRecord: NewTimeRecord) => {
    setIsLoading(true);
    setError(null);
    
    const recordWithId: TimeRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      // El modo 'no-cors' es a menudo necesario para las aplicaciones web de Google Apps Script
      // para evitar errores de CORS preflight. La respuesta será opaca.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
            // Columnas de Google Sheet
            'F. Inicio': recordWithId.startDate,
            'F. Fin': recordWithId.endDate,
            'H. Inicio': recordWithId.startTime,
            'H. Fin': recordWithId.endTime,
            'Actuación': recordWithId.description,
            'Horas': recordWithId.calculatedHours,
            'Nombre': recordWithId.name,
            'F. Registro': recordWithId.timestamp,
        })
      });

      // Con 'no-cors', no podemos inspeccionar la respuesta.
      // Asumimos que tuvo éxito si fetch() no lanza un error.
      setRecords(prev => [{ ...recordWithId, status: 'success' }, ...prev]);
      
    } catch (err) {
      console.error('Failed to send data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Fallo al enviar los datos. Revisa la consola y la publicación de tu Apps Script. (${errorMessage})`);
      // Para esta implementación, solo guardaremos los envíos exitosos.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-slate-800 font-sans">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <LogoIcon />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Registro de Horas por Período</h1>
            </div>
            <p className="text-slate-600">Introduce el inicio y el fin de tu actuación. Las horas se calcularán automáticamente.</p>
        </header>
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <TimeRecordForm onSubmit={handleSubmit} isLoading={isLoading} />
        
        <RecentRecordsTable records={records} />

      </div>
    </div>
  );
}