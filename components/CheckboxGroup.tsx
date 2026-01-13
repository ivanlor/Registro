import React from 'react';

interface CheckboxGroupProps {
    label: string;
    id: string;
    options: { value: string; label: string }[];
    value: string[];
    onChange: (id: string, newValue: string[]) => void;
    required?: boolean;
    className?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, id, options, value, onChange, required, className }) => {
    const handleToggle = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(id, newValue);
    };

    const handleSelectAll = () => {
        if (value.length === options.length) {
            onChange(id, []);
        } else {
            onChange(id, options.map(o => o.value));
        }
    };

    const allSelected = value.length === options.length && options.length > 0;

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors focus:outline-none"
                >
                    {allSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                        <label
                            key={option.value}
                            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                            }`}
                        >
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => handleToggle(option.value)}
                            />
                            <div className={`w-5 h-5 mr-3 border rounded-md flex items-center justify-center transition-colors ${
                                 isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                            }`}>
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm font-medium truncate">{option.label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

export default CheckboxGroup;