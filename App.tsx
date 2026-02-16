import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { RUTINA_FORM_FIELDS, OPERACIONAL_FORM_FIELDS, PERSONAL_HORAS_FORM_FIELDS, PERSONAL_VACACIONES_FORM_FIELDS, TECNICO_FORM_FIELDS } from './constants';
import type { FormData, Status, FormField } from './types';
import { submitData } from './services/googleSheetsService';
import Input from './components/Input';
import Button from './components/Button';
import Alert from './components/Alert';
import Textarea from './components/Textarea';
import Select from './components/Select';
import CheckboxGroup from './components/CheckboxGroup';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { XCircleIcon } from './components/icons/XCircleIcon';

type Workflow = 'rutina' | 'operacional' | 'tecnico' | 'personal' | 'personal_horas' | 'personal_vacaciones';
type Errors = Record<string, string>;
type HistoryItem = {
    [key: string]: string | number | boolean | string[];
    timestamp: string;
    synced: boolean;
};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnFy_KVZQqvSATkFMeGpXUtfQVnJIljE1zm9sN68FWHCs5V5xte3pHy3X4aw1_25Gy/exec';
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1oRMEzIffoGoKdsXVNx68tJMPUCLt5pqG9D5v3IfupEs/edit';

const App: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
    const [errors, setErrors] = useState<Errors>({});
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const { currentFields, sheetName, formTitle } = useMemo(() => {
        if (workflow === 'rutina') return { currentFields: RUTINA_FORM_FIELDS, sheetName: 'Rutina', formTitle: 'Registro de Rutina' };
        if (workflow === 'operacional') return { currentFields: OPERACIONAL_FORM_FIELDS, sheetName: 'Operacional', formTitle: 'Registro Operacional' };
        if (workflow === 'tecnico') return { currentFields: TECNICO_FORM_FIELDS, sheetName: 'Bombeos', formTitle: 'Registro Técnico de Bombeo' };
        if (workflow === 'personal_horas') return { currentFields: PERSONAL_HORAS_FORM_FIELDS, sheetName: 'Registro_horario', formTitle: 'Registro de Horas por Período' };
        if (workflow === 'personal_vacaciones') return { currentFields: PERSONAL_VACACIONES_FORM_FIELDS, sheetName: 'Vacaciones', formTitle: 'Solicitud de Vacaciones' };
        return { currentFields: [], sheetName: '', formTitle: '' };
    }, [workflow]);

    const getInitialState = useCallback((fields: FormField[]): FormData => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0].substring(0, 5);
        const initialState: FormData = {};
        if (['rutina', 'operacional', 'tecnico'].includes(workflow || '')) initialState['date'] = today;
        if (workflow === 'operacional') initialState['hora'] = now;
        if (workflow === 'personal_horas') {
            initialState['fecha_inicio'] = today;
            initialState['fecha_fin'] = today;
            initialState['hora_inicio'] = now;
            initialState['hora_fin'] = now;
        }
        if (workflow === 'personal_vacaciones') {
            initialState['fecha_inicio'] = today;
            initialState['fecha_fin'] = today;
            initialState['dias'] = 1;
        }
        fields.forEach(field => {
             if (initialState[field.id] === undefined) {
                 if (field.type === 'select' && field.options && field.options.length > 0) initialState[field.id] = field.options[0].value;
                 else if (field.type === 'checkbox-group') initialState[field.id] = [];
                 else initialState[field.id] = '';
             }
        });
        return initialState;
    }, [workflow]);

    useEffect(() => {
        if (workflow && workflow !== 'personal') {
            setFormData(getInitialState(currentFields));
            setStatus({ type: 'idle', message: '' });
            setErrors({});
        }
        if (workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
            const key = `aqualia_historial_${workflow}`;
            const saved = localStorage.getItem(key);
            if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) { setHistory([]); } }
            else { setHistory([]); }
        } else { setHistory([]); }
    }, [workflow, currentFields, getInitialState]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let sanitizedValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (['ph', 'turbidez', 'cloro', 'turbidez_bruta', 'turbidez_salida', 'horas'].includes(name)) {
            sanitizedValue = sanitizedValue.replace(/\./g, ',');
        }
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            if (sanitizedValue === '') return newErrors;
            const valueForValidation = sanitizedValue.replace(',', '.');
            const numericValue = parseFloat(valueForValidation);
            if (isNaN(numericValue)) return newErrors;
            const rules: Record<string, Record<string, { cond: boolean; msg: string }>> = {
                rutina: {
                    ph: { cond: numericValue < 6.5 || numericValue > 9.5, msg: 'pH debe estar entre 6,5 y 9,5.' },
                    turbidez: { cond: numericValue > 5, msg: 'Turbidez máx: 5.' },
                    cloro: { cond: numericValue > 1, msg: 'Cloro máx: 1.' },
                },
                operacional: {
                    ph: { cond: numericValue < 6.5 || numericValue > 9.5, msg: 'pH debe estar entre 6,5 y 9,5.' },
                    turbidez_salida: { cond: numericValue > 2, msg: 'Turbidez salida máx: 2.' },
                }
            };
            if (workflow && rules[workflow] && rules[workflow][name]) {
                const rule = rules[workflow][name];
                if (rule.cond) newErrors[name] = rule.msg;
            }
            return newErrors;
        });
    }, [workflow]);

    const handleMultiSelectChange = useCallback((name: string, value: string[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        currentFields.forEach(field => {
            if (field.required) {
                const val = formData[field.id];
                if (field.type === 'checkbox-group' && (!val || (Array.isArray(val) && val.length === 0))) newErrors[field.id] = 'Campo requerido.';
                else if (!val) newErrors[field.id] = 'Campo requerido.';
            }
        });
        if (!['personal_horas', 'personal_vacaciones'].includes(workflow || '') && !formData.date) newErrors.date = 'Fecha requerida.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sheetName || !validateForm()) {
            setStatus({ type: 'error', message: 'Revisa los campos obligatorios.' });
            return;
        }
        setIsLoading(true);
        setStatus({ type: 'idle', message: '' });
        let success = false;
        try {
            await submitData(formData, APPS_SCRIPT_URL, sheetName, GOOGLE_SHEET_URL);
            success = true;
            setStatus({ type: 'success', message: 'Datos guardados correctamente.' });
        } catch (error: any) {
            success = false;
            setStatus({ type: 'error', message: error.message || 'Error de conexión.' });
        } finally {
            setIsLoading(false);
        }
        if (success || workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
            if (workflow?.startsWith('personal')) {
                const newItem = { ...formData, timestamp: new Date().toISOString(), synced: success };
                const newHistory = [newItem, ...history];
                setHistory(newHistory);
                localStorage.setItem(`aqualia_historial_${workflow}`, JSON.stringify(newHistory));
            }
            setFormData(getInitialState(currentFields));
            setErrors({});
        }
    };

    const renderHistory = () => {
        if (history.length === 0) return null;
        return (
            <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Historial Local</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Este dispositivo</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Hora Reg.</th>
                                {workflow === 'personal_horas' && (
                                    <>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">F. Inicio</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">F. Fin</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Horas</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actuación</th>
                                    </>
                                )}
                                {workflow === 'personal_vacaciones' && (
                                    <>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Días</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {history.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3">{item.synced ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <XCircleIcon className="h-5 w-5 text-orange-500" />}</td>
                                    <td className="px-4 py-3 text-slate-500">{new Date(item.timestamp).toLocaleTimeString('es-ES')}</td>
                                    {workflow === 'personal_horas' && (
                                        <>
                                            <td className="px-4 py-3 font-medium">{String(item.fecha_inicio).split('-').reverse().join('/')}</td>
                                            <td className="px-4 py-3 font-medium">{String(item.fecha_fin).split('-').reverse().join('/')}</td>
                                            <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{item.horas || '—'}</td>
                                            <td className="px-4 py-3 truncate max-w-[120px]">{String(item.nombre)}</td>
                                            <td className="px-4 py-3 truncate max-w-[150px]">{String(item.actuacion)}</td>
                                        </>
                                    )}
                                    {workflow === 'personal_vacaciones' && (
                                        <>
                                            <td className="px-4 py-3">{item.nombre} {item.apellidos}</td>
                                            <td className="px-4 py-3 font-bold">{item.dias}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (!workflow) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10 text-center">
                    <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-8">Registros Aqualia</h1>
                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        <button onClick={() => setWorkflow('rutina')} className="px-8 py-4 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-transform hover:scale-105">Registrar Rutina</button>
                        <button onClick={() => setWorkflow('operacional')} className="px-8 py-4 font-bold text-slate-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-transform hover:scale-105">Registrar Operacional</button>
                        <button onClick={() => setWorkflow('tecnico')} className="px-8 py-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105">Técnico (Bombeos)</button>
                        <button onClick={() => setWorkflow('personal')} className="px-8 py-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-transform hover:scale-105">Personal</button>
                    </div>
                </div>
            </div>
        );
    }

    if (workflow === 'personal') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10">
                    <button onClick={() => setWorkflow(null)} className="mb-6 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200">&larr; Volver</button>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-8">Gestión de Personal</h2>
                        <div className="flex flex-col gap-4 max-w-md mx-auto">
                            <button onClick={() => setWorkflow('personal_horas')} className="px-8 py-4 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:scale-105">Registro de horas</button>
                            <button onClick={() => setWorkflow('personal_vacaciones')} className="px-8 py-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 hover:scale-105">Vacaciones</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10">
                <button onClick={() => setWorkflow(workflow.startsWith('personal') ? 'personal' : null)} className="mb-6 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200">&larr; Volver</button>
                <h1 className="text-3xl font-bold text-center mb-8">{formTitle}</h1>
                {status.message && <div className="mb-6"><Alert type={status.type} message={status.message} /></div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {!workflow.startsWith('personal') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b dark:border-slate-700">
                            <Input id="date" name="date" label="Fecha" type="date" value={String(formData.date || '')} onChange={handleChange} required error={errors.date} />
                            {workflow === 'operacional' && <Input id="hora" name="hora" label="Hora" type="time" value={String(formData.hora || '')} onChange={handleChange} required />}
                        </div>
                    )}
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${workflow === 'personal_horas' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                        {currentFields.map(field => {
                            if (field.type === 'textarea') return <Textarea key={field.id} id={field.id} name={field.id} label={field.label} value={String(formData[field.id] || '')} onChange={handleChange} required={field.required} className={field.className} />;
                            if (field.type === 'select') return <Select key={field.id} id={field.id} name={field.id} label={field.label} value={String(formData[field.id] || '')} onChange={handleChange} required={field.required} options={field.options || []} className={field.className} />;
                            if (field.type === 'checkbox-group') return <CheckboxGroup key={field.id} id={field.id} label={field.label} options={field.options || []} value={(formData[field.id] as string[]) || []} onChange={handleMultiSelectChange} required={field.required} className={field.className} />;
                            return <Input key={field.id} id={field.id} name={field.id} label={field.label} type={field.type} value={String(formData[field.id] || '')} onChange={handleChange} required={field.required} error={errors[field.id]} className={field.className} inputMode={['ph', 'turbidez_bruta', 'turbidez_salida', 'cloro', 'horas'].includes(field.id) ? 'decimal' : undefined} />;
                        })}
                    </div>
                    <Button type="submit" isLoading={isLoading}>{isLoading ? 'Enviando...' : 'Guardar Registro'}</Button>
                </form>
                {renderHistory()}
            </div>
        </div>
    );
};

export default App;