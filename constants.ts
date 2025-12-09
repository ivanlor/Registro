
import type { FormField } from './types';

export const SAMPLING_POINTS = [
    { value: '', label: 'Selecciona un punto' },
    { value: 'Parque Rioseco', label: 'Parque Rioseco' },
    { value: 'Parque Chaos', label: 'Parque Chaos' },
    { value: 'Parque Lopez Suarez', label: 'Parque López Suárez' },
    { value: 'Parque A Pinguela', label: 'Parque A Pinguela' },
    { value: 'Parque Compania', label: 'Parque Compañía' },
    { value: 'Zona Malecon', label: 'Zona Malecón' },
    { value: 'Calle Santiago', label: 'Calle Santiago' },
    { value: 'Parque Hospital', label: 'Parque Hospital' },
    { value: 'Parque Florida', label: 'Parque Florida' },
    { value: 'Oficina', label: 'Oficina' },
    { value: 'EDAR', label: 'EDAR' },
];

export const BOMBEO_STATIONS = [
    { value: 'Bombeo Moreda', label: 'Bombeo Moreda' },
    { value: 'Bombeo Fiolleda', label: 'Bombeo Fiolleda' },
    { value: 'Bombeo Chavaga', label: 'Bombeo Chavaga' },
    { value: 'Bombeo Cornado', label: 'Bombeo Cornado' },
    { value: 'Bombeo Sindrán', label: 'Bombeo Sindrán' },
];

export const RUTINA_FORM_FIELDS: FormField[] = [
    { id: 'punto_de_muestreo', label: 'Punto de Muestreo', type: 'select', options: SAMPLING_POINTS, required: true, className: 'md:col-span-2 lg:col-span-3' },
    { id: 'turbidez', label: 'Turbidez', type: 'text', required: true },
    { id: 'ph', label: 'pH', type: 'text', required: true },
    { id: 'cloro', label: 'Cloro libre residual', type: 'text', required: true },
    { id: 'color', label: 'Color', type: 'text', required: false },
    { id: 'olor', label: 'Olor', type: 'text', required: false },
    { id: 'sabor', label: 'Sabor', type: 'text', required: false },
    { id: 'operario', label: 'Operario', type: 'text', required: true, className: 'md:col-span-2 lg:col-span-3' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, className: 'md:col-span-2 lg:col-span-3' },
];

// CORREGIDO: Orden cambiado para coincidir con la hoja (pH, Turbidez, Cloro)
export const OPERACIONAL_FORM_FIELDS: FormField[] = [
    { id: 'ph', label: 'pH', type: 'text', required: true },
    { id: 'turbidez', label: 'Turbidez', type: 'text', required: true },
    { id: 'cloro', label: 'Cloro libre residual', type: 'text', required: true },
    { id: 'operario', label: 'Operario', type: 'text', required: true, className: 'md:col-span-2 lg:col-span-3' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, className: 'md:col-span-2 lg:col-span-3' },
];

export const TECNICO_FORM_FIELDS: FormField[] = [
    { id: 'bombeo', label: 'Estación de Bombeo', type: 'select', options: BOMBEO_STATIONS, required: true, className: 'md:col-span-2 lg:col-span-2' },
    { id: 'total_bomba_1', label: 'Total Bomba 1', type: 'number', required: true },
    { id: 'horas_bomba_1', label: 'Horas Bomba 1', type: 'number', required: true },
    { id: 'total_bomba_2', label: 'Total Bomba 2', type: 'number', required: true },
    { id: 'horas_bomba_2', label: 'Horas Bomba 2', type: 'number', required: true },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, className: 'md:col-span-2 lg:col-span-2' },
];

// CORREGIDO: Cambiado 'horas_extra' por 'horas' para coincidir con la columna F de la hoja
export const PERSONAL_HORAS_FORM_FIELDS: FormField[] = [
    { id: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { id: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true },
    { id: 'hora_inicio', label: 'Hora Inicio', type: 'time', required: true },
    { id: 'hora_fin', label: 'Hora Fin', type: 'time', required: true },
    { id: 'actuacion', label: 'Actuación / Descripción', type: 'text', required: true, className: 'md:col-span-2 lg:col-span-2' },
    { id: 'horas', label: 'Horas', type: 'text', required: true, className: 'md:col-span-2 lg:col-span-2' },
    { id: 'nombre', label: 'Nombre', type: 'text', required: true, className: 'md:col-span-2 lg:col-span-2' },
    { id: 'observaciones', label: 'Observaciones', type: 'textarea', required: false, className: 'md:col-span-2 lg:col-span-4' },
];

export const PERSONAL_VACACIONES_FORM_FIELDS: FormField[] = [
    { id: 'nombre', label: 'Nombre', type: 'text', required: true },
    { id: 'apellidos', label: 'Apellidos', type: 'text', required: true },
    { id: 'fecha_inicio', label: 'F. Inicio', type: 'date', required: true },
    { id: 'fecha_fin', label: 'F. Fin', type: 'date', required: true },
    { id: 'dias', label: 'Días', type: 'number', required: true },
];
