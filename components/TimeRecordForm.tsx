import React, { useState, useMemo, useRef } from 'react';
import type { NewTimeRecord } from '../types';
import { CalendarIcon, ClockIcon } from './icons';

interface TimeRecordFormProps {
  onSubmit: (record: NewTimeRecord) => void;
  isLoading: boolean;
}

const InputField: React.FC<{ label: string; children: React.ReactNode, htmlFor?: string }> = ({ label, children, htmlFor }) => (
    <div className="flex flex-col">
        <label htmlFor={htmlFor} className="mb-1 text-sm font-medium text-slate-600">{label}</label>
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
    const [observations, setObservations] = useState('');
    const [calculatedHours, setCalculatedHours] = useState('');

    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);
    const startTimeRef = useRef<HTMLInputElement>(null);
    const endTimeRef = useRef<HTMLInputElement>(null);

    const handleIconClick = (ref: React.RefObject<HTMLInputElement>) => {
        const input = ref.current;
        if (input) {
            try {
                // Prioriza showPicker si existe y es una función.
                if ('showPicker' in input && typeof (input as any).showPicker === 'function') {
                    (input as any).showPicker();
                } else {
                    // Fallback para navegadores que no soportan showPicker.
                    input.focus();
                }
            } catch (error) {
                // Si showPicker() es bloqueado o falla, puede lanzar un error.
                // Se recurre a focus() para asegurar que algo suceda.
                console.warn('showPicker() falló, se usará focus() como alternativa. Error:', error);
                input.focus();
            }
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (newStartDate > endDate) {
            setEndDate(newStartDate);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hoursAsNumber = parseFloat(calculatedHours.replace(',', '.')) || 0;
        onSubmit({
            startDate,
            endDate,
            startTime,
            endTime,
            name,
            description,
            observations,
            calculatedHours: hoursAsNumber,
        });
        setName('');
        setDescription('');
        setObservations('');
        setCalculatedHours('');
    };
    
    const isFormValid = name.trim() !== '' && description.trim() !== '';

    return (
        <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Nuevo Registro</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="Fecha Inicio" htmlFor="startDate">
                        <div className="relative">
                           <input id="startDate" type="date" value={startDate} onChange={handleStartDateChange} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required ref={startDateRef} />
                            <button type="button" onClick={() => handleIconClick(startDateRef)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Seleccionar fecha de inicio">
                               <CalendarIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                    </InputField>
                    <InputField label="Fecha Fin" htmlFor="endDate">
                         <div className="relative">
                            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required ref={endDateRef} />
                             <button type="button" onClick={() => handleIconClick(endDateRef)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Seleccionar fecha de fin">
                              <CalendarIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                    </InputField>
                    <InputField label="Hora Inicio" htmlFor="startTime">
                         <div className="relative">
                            <input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required ref={startTimeRef} />
                             <button type="button" onClick={() => handleIconClick(startTimeRef)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Seleccionar hora de inicio">
                              <ClockIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                    </InputField>
                    <InputField label="Hora Fin" htmlFor="endTime">
                         <div className="relative">
                            <input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} min={startDate === endDate ? startTime : undefined} className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required ref={endTimeRef} />
                            <button type="button" onClick={() => handleIconClick(endTimeRef)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Seleccionar hora de fin">
                              <ClockIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                    </InputField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nombre (Categoría)" htmlFor="name">
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Carlos" className="w-full p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                    </InputField>
                    <InputField label="Actuación / Descripción" htmlFor="description">
                        <input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Avería en..." className="w-full p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" required />
                    </InputField>
                </div>
                 <div>
                    <InputField label="Observaciones (Opcional)" htmlFor="observations">
                        <textarea id="observations" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Detalles adicionales..." className="w-full p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
                    </InputField>
                </div>
                 <div className="md:col-span-1">
                    <InputField label="Horas Extra (Opcional)" htmlFor="calculatedHours">
                        <input 
                            id="calculatedHours"
                            type="text"
                            inputMode="decimal"
                            value={calculatedHours}
                            onChange={e => setCalculatedHours(e.target.value)}
                            placeholder="Ej: 1"
                            className="w-full p-2 h-[42px] bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </InputField>
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