
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, className, ...props }) => {
    return (
        <div className={className}>
            <label htmlFor={id} className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <textarea
                id={id}
                rows={4}
                className="w-full px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                {...props}
            />
        </div>
    );
};

export default Textarea;