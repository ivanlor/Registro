import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { RUTINA_FORM_FIELDS, OPERACIONAL_FORM_FIELDS, PERSONAL_HORAS_FORM_FIELDS, PERSONAL_VACACIONES_FORM_FIELDS } from './constants';
import type { FormData, Status, FormField } from './types';
import { submitData } from './services/googleSheetsService';
import Input from './components/Input';
import Button from './components/Button';
import Alert from './components/Alert';
import Textarea from './components/Textarea';
import Select from './components/Select';

type Workflow = 'rutina' | 'operacional' | 'personal' | 'personal_horas' | 'personal_vacaciones';
type Errors = Record<string, string>;

// --- URLs Config ---
// IMPORTANTE: Sustituye esta URL si cambia al crear una nueva implementación
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnFy_KVZQqvSATkFMeGpXUtfQVnJIljE1zm9sN68FWHCs5V5xte3pHy3X4aw1_25Gy/exec';

// URL de tu hoja de cálculo "Monforte de Lemos"
// Aseguramos que el ID es el correcto (I mayúscula: ...D5v3IfupEs)
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1oRMEzIffoGoKdsXVNx68tJMPUCLt5pqG9D5v3IfupEs/edit';


const App: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
    const [errors, setErrors] = useState<Errors>({});

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
        
        // Base fields based on workflow
        if (workflow === 'rutina' || workflow === 'operacional') {
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
            initialState['dias'] = 1; // Default to 1 day
        }

        fields.forEach(field => {
             if (initialState[field.id] === undefined) {
                 if (field.type === 'select' && field.options && field.options.length > 0) {
                     initialState[field.id] = field.options[0].value;
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
    }, [workflow, currentFields, getInitialState]);


    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Normalización para eliminar tildes y diacríticos (ej: á -> a, ñ -> n)
        // Esto impide la inserción de tildes en cualquier campo.
        let sanitizedValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Reemplazo automático de puntos por comas en campos específicos de rutina y operacional
        if ((workflow === 'rutina' || workflow === 'operacional') && ['ph', 'turbidez', 'cloro'].includes(name)) {
            sanitizedValue = sanitizedValue.replace(/\./g, ',');
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: sanitizedValue };
            return newData;
        });

        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];

            if (sanitizedValue === '') return newErrors;

            // Para validación, convertimos coma a punto para que parseFloat funcione
            const valueForValidation = sanitizedValue.replace(',', '.');
            const numericValue = parseFloat(valueForValidation);

            // Si no es un número válido, no podemos validar rangos (salvo que el campo sea texto libre, pero 'ph' y 'cloro' requieren ser números)
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sheetName) return;
        
        setIsLoading(true);
        setStatus({ type: 'idle', message: '' });

        try {
            const result = await submitData(formData, APPS_SCRIPT_URL, sheetName, GOOGLE_SHEET_URL);
            setStatus({ type: 'success', message: result.message });
            setFormData(getInitialState(currentFields));
            setErrors({});
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            setStatus({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!workflow) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans text-center relative">
                {status.message && status.type !== 'idle' && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
                         <Alert type={status.type} message={status.message} />
                    </div>
                )}

                 <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-white">Registros Aqualia</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">Selecciona el tipo de registro que deseas realizar.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap justify-center">
                    <button onClick={() => setWorkflow('rutina')} className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                        Registrar Rutina
                    </button>
                    <button onClick={() => setWorkflow('operacional')} className="px-8 py-4 text-lg font-semibold text-white bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform transform hover:scale-105">
                        Registrar Operacional
                    </button>
                    <button onClick={() => setWorkflow('personal')} className="px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                        Personal
                    </button>
                </div>
                 <footer className="w-full max-w-2xl mx-auto mt-12 px-4">
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                         Creado para la recolección eficiente de datos.
                    </div>
                </footer>
            </div>
        );
    }

    if (workflow === 'personal') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10">
                     <div className="flex justify-start mb-4">
                        <button 
                            onClick={() => setWorkflow(null)} 
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg px-4 py-2 shadow-sm transition-colors duration-200"
                        >
                            &larr; Volver
                        </button>
                     </div>
                    
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Gestión de Personal</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">Elige una opción:</p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button onClick={() => setWorkflow('personal_horas')} className="px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">
                                Registro de horas
                            </button>
                            <button onClick={() => setWorkflow('personal_vacaciones')} className="px-8 py-4 text-lg font-semibold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform transform hover:scale-105">
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
                        <button 
                            onClick={() => {
                                // If currently in a personal sub-workflow, go back to personal menu. Otherwise go to main menu.
                                if (workflow === 'personal_horas' || workflow === 'personal_vacaciones') {
                                    setWorkflow('personal');
                                } else {
                                    setWorkflow(null);
                                }
                            }} 
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg px-4 py-2 shadow-sm transition-colors duration-200"
                        >
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

                        <div className={workflow === 'personal_horas' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
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
                                    inputMode={((workflow === 'rutina' || workflow === 'operacional') && ['ph', 'turbidez', 'cloro'].includes(field.id)) ? 'decimal' : undefined}
                                />
                            )})}
                        </div>

                        <div className="pt-6">
                            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                                {isLoading ? 'Enviando...' : 'Enviar Datos'}
                            </Button>
                        </div>
                    </form>
                </div>
                 <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    <p>Creado para la recolección eficiente de datos.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;