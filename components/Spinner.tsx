
import React from 'react';

interface SpinnerProps {
    message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message = "Cargando..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-solid border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">{message}</p>
        </div>
    );
};