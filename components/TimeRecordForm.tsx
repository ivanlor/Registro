import React, { useState, useEffect, useMemo } from 'react';
import type { NewTimeRecord } from '../types';
import { CalendarIcon, ClockIcon } from './icons';

interface TimeRecordFormProps {
  onSubmit: (record: NewTimeRecord) => void;
  isLoading: boolean;
}

const InputField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium text-slate-600">{label}</label>
        {children}
    </div>
);

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const formatTime = (date: Date): string => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
};

export const TimeRecordForm: React.FC<TimeRecordFormProps> = ({ onSubmit, isLoading }) => {
    const now = useMemo(() => new Date(), []);
    const oneHourLater = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000), [now]);

    const [startDate, setStartDate] = useState(formatDate(now));
    const [endDate, setEndDate] = useState(formatDate(oneHourLater));
    const [startTime, setStartTime] = useState(formatTime(now));
    const [endTime, setEndTime] = useState(formatTime(oneHourLater));
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [calculatedHours, setCalculatedHours] = useState(1);

    useEffect(() => {
        if (startDate && startTime && endDate && endTime) {
            try {
                const startDateTime = new Date(`${startDate}T${startTime}`);
                const endDateTime = new Date(`${endDate}T${endTime}`);
                if (endDateTime > startDateTime) {
                    const diffMs = endDateTime.getTime() - startDateTime.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    setCalculatedHours(parseFloat(diffHours.toFixed(2)));
                } else {
                    setCalculatedHours(0);
                }
            } catch (error) {
                console.error("Invalid date/time format", error);
                setCalculatedHours(0);
            }
        }
    }, [startDate, startTime, endDate, endTime]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            startDate,
            endDate,
            startTime,
            endTime,
            name,
            description,
            calculatedHours,
        });
        // Clear fields after submission
        setName('');
        setDescription('');
    };
    
    const isFormValid = name.trim() !== '' && description.trim() !== '' && calculatedHours > 0;

    return (
        <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Nuevo Registro</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="Fecha Inicio">
                        <div className="relative">
                           <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </InputField>
                    <InputField label="Fecha Fin">
                         <div className="relative">
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </InputField>
                    <InputField label="Hora Inicio">
                         <div className="relative">
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                            <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </InputField>
                    <InputField label="Hora Fin">
                         <div className="relative">
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                            <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                    </InputField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <InputField label="Nombre (Categoría)">
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Carlos" className="w-full p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                        </InputField>
                    </div>
                     <div className="md:col-span-1">
                        <InputField label="Horas Calculadas (h)">
                            <div className="w-full p-2 h-[42px] flex items-center bg-slate-100 border border-slate-300 rounded-md text-slate-800 font-medium">
                                {calculatedHours.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </InputField>
                    </div>
                     <div className="md:col-span-2">
                        <InputField label="Actuación / Descripción">
                            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Avería en..." className="w-full p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                        </InputField>
                    </div>
                </div>
                <button type="submit" disabled={isLoading || !isFormValid} className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none">
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Añadir Registro'}
                </button>
            </form>
        </div>
    );
};