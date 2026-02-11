import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function Toast({ message, type = 'success' }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        info: <AlertCircle className="w-5 h-5" />
    };

    const colors = {
        success: 'bg-teal-600 border-teal-500',
        error: 'bg-red-600 border-red-500',
        info: 'bg-blue-600 border-blue-500'
    };

    return (
        <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 ${colors[type]} text-white rounded-lg shadow-2xl border-l-4 transition-all duration-300 ${isVisible ? 'animate-in slide-in-from-right-5' : 'animate-out slide-out-to-right-5 opacity-0'
                }`}
        >
            {icons[type]}
            <span className="font-medium text-sm">{message}</span>
        </div>
    );
}
