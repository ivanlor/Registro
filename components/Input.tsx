
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, error, ...props }) => {
    return (
        <div className={className}>
            <label htmlFor={id} className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                id={id}
                className={`w-full px-4 py-2.5 text-slate-700 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition duration-200 dark:text-white ${
                    props.readOnly
                        ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed text-slate-500 border-slate-300 dark:border-slate-600'
                        : `dark:bg-slate-700 dark:placeholder-slate-400 ${
                            error
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500 dark:border-slate-600 dark:focus:ring-blue-500 dark:focus:border-blue-500'
                        }`
                }`}
                step={props.type === 'number' ? 'any' : undefined}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default Input;
