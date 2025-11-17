import React, { useState, useEffect } from 'react';
import type { TimeRecord, NewTimeRecord } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TimeRecordForm } from './components/TimeRecordForm';
import { RecentRecordsTable } from './components/RecentRecordsTable';
import { LogoIcon } from './components/icons';
import { Toast } from './components/Toast';
import { addRecordToSheet, deleteRecordFromSheet } from './api/google-sheets';

export default function App() {
  const [records, setRecords] = useLocalStorage<TimeRecord[]>('timeRecords', []);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (newRecord: NewTimeRecord) => {
    setIsLoading(true);
    setNotification(null);
    
    const recordWithId: TimeRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await addRecordToSheet(recordWithId);
      
      if (response.result !== 'success') {
        throw new Error(response.message || 'Error desconocido desde Google Scripts.');
      }

      setRecords(prev => [{ ...recordWithId, status: 'success' }, ...prev]);
      setNotification({ message: 'Registro añadido a Google Sheets con éxito.', type: 'success' });
      
    } catch (err) {
      console.error('Failed to send data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setNotification({ message: `Error al enviar: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro de la copia local y de Google Sheets?')) {
        return;
    }
    
    setDeletingId(recordId);
    setNotification(null);

    try {
      const response = await deleteRecordFromSheet(recordId);

      if (response.result !== 'success') {
        throw new Error(response.message || 'Error desconocido desde Google Scripts.');
      }

      setRecords(prev => prev.filter(r => r.id !== recordId));
      setNotification({ message: 'Registro eliminado con éxito.', type: 'success' });

    } catch (err) {
      console.error('Failed to delete data:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setNotification({ message: `Error al eliminar: ${errorMessage}`, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-slate-800 font-sans">
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
          <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                  <LogoIcon />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Registro de Horas por Período</h1>
              </div>
              <p className="text-slate-600">Introduce el inicio y el fin de tu actuación. Las horas se calcularán automáticamente y se enviarán a Google Sheets.</p>
          </header>
          
          <TimeRecordForm onSubmit={handleSubmit} isLoading={isLoading} />
          
          <RecentRecordsTable records={records} onDelete={handleDelete} deletingId={deletingId} />

        </div>
      </div>
    </>
  );
}
