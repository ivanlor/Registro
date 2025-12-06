
export interface FormData {
    [key: string]: string | number;
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'time' | 'textarea' | 'select';
    required?: boolean;
    readOnly?: boolean;
    options?: { value: string; label: string }[];
    className?: string;
}

export interface Status {
    type: 'idle' | 'success' | 'error';
    message: string;
}