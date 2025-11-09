import React from 'react';
import type { TimeRecord } from '../types';

interface RecentRecordsTableProps {
  records: TimeRecord[];
}

export const RecentRecordsTable: React.FC<RecentRecordsTableProps> = ({ records }) => {
  const successfulRecords = records.filter(r => r.status === 'success');
  const headers = ['F. INICIO', 'F. FIN', 'H. INICIO', 'H. FIN', 'NOMBRE', 'HORAS', 'ACTUACIÓN', 'FECHA REGISTRO'];
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 mt-8">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Últimos Registros Enviados (Copia Local)</h2>
        
        {successfulRecords.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Cuando envíes un registro exitoso, aparecerá aquí.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-indigo-50">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {successfulRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-indigo-50/60 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.startDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.endDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.startTime}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.endTime}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{record.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.calculatedHours.toLocaleString('es-ES')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(record.timestamp).toLocaleString('es-ES')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};