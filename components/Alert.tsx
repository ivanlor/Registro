
import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import type { Status } from '../types';


interface AlertProps {
    type: Status['type'];
    message: string;
}

const alertStyles = {
    success: {
        container: 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600/50 dark:text-green-300',
        icon: 'text-green-500 dark:text-green-400',
    },
    error: {
        container: 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600/50 dark:text-red-300',
        icon: 'text-red-500 dark:text-red-400',
    },
    idle: {
        container: 'hidden',
        icon: '',
    },
};

const Alert: React.FC<AlertProps> = ({ type, message }) => {
    if (type === 'idle' || !message) return null;

    const styles = alertStyles[type];
    const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

    return (
        <div className={`border px-4 py-3 rounded-lg relative ${styles.container}`} role="alert">
            <div className="flex items-center">
                <div className={`mr-3 ${styles.icon}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <span className="block sm:inline font-medium">{message}</span>
            </div>
        </div>
    );
};

export default Alert;
