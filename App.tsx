
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

// --- URLs Config ---
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
        if (workflow === 'rutina') {
            return {
                currentFields: RUTINA_FORM_FIELDS,
                sheetName: 'Rutina',
                formTitle: 'Registro de Rutina'
            };
        }
        if (workflow === 'operacional') {
            return {
                currentFields: OPERACIONAL_FORM_FIELDS,
                sheetName: 'Operacional',
                formTitle: 'Registro Operacional'
            };
        }
        if (workflow === 'tecnico') {
            return {
                currentFields: TECNICO_FORM_FIELDS,
                sheetName: 'Bombeos',
                formTitle: 'Registro Técnico de Bombeo'
            };
        }
        if (workflow === 'personal_horas') {
            return {
                currentFields: PERSONAL_HORAS_FORM_FIELDS,
                sheetName: 'Registro_horario',
                formTitle: 'Registro de Horas por Período'
            };
        }
        if (workflow === 'personal_vacaciones') {
            return {
                currentFields: PERSONAL_VACACIONES_FORM_FIELDS,
                sheetName: 'Vacaciones',
                formTitle: 'Solicitud de Vacaciones'
            };
        }
        return { currentFields: [], sheetName: '', formTitle: '' };
    }, [workflow]);

    const getInitialState = useCallback((fields: FormField[]): FormData => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0].substring(0, 5);
        
        const initialState: FormData = {};
        
        if (workflow === 'rutina' || workflow === 'operacional' || workflow === 'tecnico') {
            initialState['date'] = today;
        }

        if (workflow === 'operacional') {
            initialState['hora'] = now;
        }
        
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
                 if (field.type === 'select' && field.options && field.options.length > 0) {
                     initialState[field.id] = field.options[0].value;
                } else if (field.type === 'checkbox-group') {
                    initialState[field.id] = [];
                } else {
                    initialState[field.id] = '';
                }
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
            if (saved) {
                try {
                    setHistory(JSON.parse(saved));
                } catch (e) {
                    setHistory([]);
                }
            } else {
                setHistory([]);
            }
        } else {
            setHistory([]);
        }
    }, [workflow, currentFields, getInitialState]);


    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let sanitizedValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if ((workflow === 'rutina' || workflow === 'operacional') && ['ph', 'turbidez', 'cloro'].includes(name)) {
            sanitizedValue = sanitizedValue.replace(/\./g, ',');
        }

        if (workflow === 'personal_horas' && name === 'horas') {
            sanitizedValue = sanitizedValue.replace(/\./g, ',');
            sanitizedValue = sanitizedValue.replace(/[^0-9,]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            if (sanitizedValue === '') return newErrors;

            const valueForValidation = sanitizedValue.replace(',', '.');
            const numericValue = parseFloat(valueForValidation);
            if (isNaN(numericValue)) return newErrors;

            const validationRules: Record<string, Record<string, { condition: boolean; message: string }>> = {
                rutina: {
                    ph: { condition: numericValue < 6.5 || numericValue > 9.5, message: 'El valor de pH debe estar entre 6,5 y 9,5.' },
                    turbidez: { condition: numericValue > 5, message: 'El valor de turbidez no debe superar 5.' },
                    cloro: { condition: numericValue > 1, message: 'El valor de cloro no debe superar 1.' },
                },
                operacional: {
                    ph: { condition: numericValue < 6.5 || numericValue > 9.5, message: 'El valor de pH debe estar entre 6,5 y 9,5.' },
                    turbidez: { condition: numericValue > 2, message: 'El valor de turbidez no debe superar 2.' },
                },
                tecnico: {},
                personal_horas: {},
                personal_vacaciones: {}
            };
            
            if (workflow && workflow !== 'personal') {
                const rulesForWorkflow = validationRules[workflow];
                if (rulesForWorkflow && rulesForWorkflow[name]) {
                    const rule = rulesForWorkflow[name];
                    if (rule.condition) {
                        newErrors[name] = rule.message;
                    }
                }
            }
            return newErrors;
        });
    }, [workflow]);

    const handleMultiSelectChange = useCallback((name: string, value: string[]) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        currentFields.forEach(field => {
            if (field.required) {
                const val = formData[field.id];
                if (field.type === 'checkbox-group') {
                    if (!val || (Array.isArray(val) && val.length === 0)) {
                        newErrors[field.id] = 'Debes seleccionar al menos una opción.';
                    }
                } else if (!val) {
                    newErrors[field.id] = 'Este campo es obligatorio.';
                }
            }
        });
        
        if (workflow !== 'personal_horas' && workflow !== 'personal_vacaciones') {
            if (!formData.date) newErrors.date = 'La fecha es obligatoria.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sheetName) return;

        if (!validateForm()) {
            setStatus({ type: 'error', message: 'Por favor, rellena todos los campos obligatorios correctamente.' });
            return;
        }
        
        setIsLoading(true);
        setStatus({ type: 'idle', message: '' });

        let submissionSuccess = false;

        try {
            const result = await submitData(formData, APPS_SCRIPT_URL, sheetName, GOOGLE_SHEET_URL);
            submissionSuccess = true;
            setStatus({ type: 'success', message: result.message });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            submissionSuccess = false;
            
            if (workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
                setStatus({ 
                    type: 'error', 
                    message: `Error al conectar con Google Sheets: ${message}. El registro se guardará LOCALMENTE.` 
                });
            } else {
                setStatus({ type: 'error', message });
            }
        } finally {
            setIsLoading(false);
        }

        if (submissionSuccess || workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
            if (workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
                const newItem: HistoryItem = { 
                    ...formData, 
                    timestamp: new Date().toISOString(),
                    synced: submissionSuccess 
                };
                
                const newHistory = [newItem, ...history];
                setHistory(newHistory);
                localStorage.setItem(`aqualia_historial_${workflow}`, JSON.stringify(newHistory));
                
                setFormData(getInitialState(currentFields));
                setErrors({});
            } else if (submissionSuccess) {
                setFormData(getInitialState(currentFields));
                setErrors({});
            }
        }
    };

    const renderHistory = () => {
        if (history.length === 0) return null;

        return (
            <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Historial Local</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        Este dispositivo
                    </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-10">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fecha Registro</th>
                                {workflow === 'personal_horas' && (
                                    <>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fecha Actividad</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actuación</th>
                                    </>
                                )}
                                {workflow === 'personal_vacaciones' && (
                                    <>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Fechas</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Días</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {history.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        {item.synced ? (
                                            <div className="flex items-center text-green-600 dark:text-green-400" title="Sincronizado con Google Sheets">
                                                <CheckCircleIcon className="h-5 w-5" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-orange-500 dark:text-orange-400" title="Guardado solo localmente (Error de conexión)">
                                                <XCircleIcon className="h-5 w-5" />
                                                <span className="ml-1 text-xs">Local</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleString('es-ES')}
                                    </td>
                                    {workflow === 'personal_horas' && (
                                        <>
                                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium whitespace-nowrap">
                                                {String(item.fecha_inicio)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {String(item.nombre)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                                {String(item.actuacion)}
                                            </td>
                                        </>
                                    )}
                                    {workflow === 'personal_vacaciones' && (
                                        <>
                                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium whitespace-nowrap">
                                                {item.nombre} {item.apellidos}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {item.fecha_inicio} al {item.fecha_fin}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {String(item.dias)}
                                            </td>
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

    const getGridClass = () => {
        if (workflow === 'personal_horas') return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
        if (workflow === 'tecnico') return "grid grid-cols-1 md:grid-cols-2 gap-6";
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    };

    if (!workflow) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10 text-center relative">
                    {status.message && status.type !== 'idle' && (
                        <div className="mb-6 text-left">
                             <Alert type={status.type} message={status.message} />
                        </div>
                    )}
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 dark:text-white">Registros Aqualia</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">Selecciona el tipo de registro.</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
                        <button onClick={() => setWorkflow('rutina')} className="w-full px-8 py-4 text-xl font-bold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform transform hover:scale-105">
                            Registrar Rutina
                        </button>
                        <button onClick={() => setWorkflow('operacional')} className="w-full px-8 py-4 text-xl font-bold text-slate-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-transform transform hover:scale-105">
                            Registrar Operacional
                        </button>
                         <button onClick={() => setWorkflow('tecnico')} className="w-full px-8 py-4 text-xl font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                            Técnico (Bombeos)
                        </button>
                        <button onClick={() => setWorkflow('personal')} className="w-full px-8 py-4 text-xl font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105">
                            Personal
                        </button>
                    </div>
                     <footer className="w-full mt-8">
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                             Creado para la recolección eficiente de datos.
                        </div>
                    </footer>
                </div>
            </div>
        );
    }

    if (workflow === 'personal') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10">
                     <div className="flex justify-start mb-4">
                        <button onClick={() => setWorkflow(null)} className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg px-4 py-2 shadow-sm transition-colors duration-200">
                            &larr; Volver
                        </button>
                     </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Gestión de Personal</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">Elige una opción:</p>
                        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
                            <button onClick={() => setWorkflow('personal_horas')} className="w-full px-8 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                                Registro de horas
                            </button>
                            <button onClick={() => setWorkflow('personal_vacaciones')} className="w-full px-8 py-4 text-xl font-bold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform transform hover:scale-105">
                                Vacaciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10">
                     <div className="flex justify-start mb-4">
                        <button onClick={() => { if (workflow === 'personal_horas' || workflow === 'personal_vacaciones') { setWorkflow('personal'); } else { setWorkflow(null); } }} className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg px-4 py-2 shadow-sm transition-colors duration-200">
                            &larr; Volver
                        </button>
                    </div>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white">{formTitle}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Introduce los datos correspondientes.</p>
                    </div>

                    {status.message && (
                        <div className="mb-6">
                            <Alert type={status.type} message={status.message} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {workflow !== 'personal_horas' && workflow !== 'personal_vacaciones' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Input
                                        id="date"
                                        name="date"
                                        label="Fecha"
                                        type="date"
                                        value={String(formData.date || '')}
                                        onChange={handleChange}
                                        required
                                        error={errors.date}
                                        className="md:col-span-2 lg:col-span-3"
                                    />
                                    {workflow === 'operacional' && (
                                        <Input
                                            id="hora"
                                            name="hora"
                                            label="Hora"
                                            type="time"
                                            value={String(formData.hora || '')}
                                            onChange={handleChange}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>
                            </>
                        )}

                        <div className={getGridClass()}>
                            {currentFields.map(field => {
                                if (field.type === 'textarea') {
                                    return (
                                        <Textarea
                                            key={field.id}
                                            id={field.id}
                                            name={field.id}
                                            label={field.label}
                                            value={String(formData[field.id] || '')}
                                            onChange={handleChange}
                                            placeholder={`Introduce ${field.label.toLowerCase()}`}
                                            required={field.required}
                                            className={field.className}
                                        />
                                    )
                                }
                                if (field.type === 'select') {
                                    return (
                                        <Select
                                            key={field.id}
                                            id={field.id}
                                            name={field.id}
                                            label={field.label}
                                            value={String(formData[field.id] || '')}
                                            onChange={handleChange}
                                            required={field.required}
                                            options={field.options || []}
                                            className={field.className}
                                        />
                                    )
                                }
                                if (field.type === 'checkbox-group') {
                                    return (
                                        <CheckboxGroup
                                            key={field.id}
                                            id={field.id}
                                            label={field.label}
                                            options={field.options || []}
                                            value={(formData[field.id] as string[]) || []}
                                            onChange={handleMultiSelectChange}
                                            required={field.required}
                                            className={field.className}
                                        />
                                    )
                                }
                                return (
                                <Input
                                    key={field.id}
                                    id={field.id}
                                    name={field.id}
                                    label={field.label}
                                    type={field.type}
                                    value={String(formData[field.id] || '')}
                                    onChange={handleChange}
                                    placeholder={!field.readOnly ? `Introduce ${field.label.toLowerCase()}` : ''}
                                    required={field.required}
                                    readOnly={field.readOnly}
                                    error={errors[field.id]}
                                    className={field.className}
                                    inputMode={
                                        ((workflow === 'rutina' || workflow === 'operacional') && ['ph', 'turbidez', 'cloro'].includes(field.id)) ||
                                        (workflow === 'personal_horas' && field.id === 'horas')
                                        ? 'decimal' : undefined
                                    }
                                />
                            )})}
                        </div>

                        <div className="pt-6">
                            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                                {isLoading ? 'Enviando...' : 'Guardar Registro'}
                            </Button>
                        </div>
                    </form>
                    {(workflow === 'personal_horas' || workflow === 'personal_vacaciones') && renderHistory()}
                </div>
                 <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    <p>Creado para la recolección eficiente de datos.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
