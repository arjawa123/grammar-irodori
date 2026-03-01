'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from '@phosphor-icons/react';

let toastId = 0;

const toasts = [];
let setToastsState = null;

export function showToast(message, type = 'info') {
    const id = ++toastId;
    const toast = { id, message, type };
    toasts.push(toast);
    if (setToastsState) setToastsState([...toasts]);

    setTimeout(() => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx > -1) {
            toasts.splice(idx, 1);
            if (setToastsState) setToastsState([...toasts]);
        }
    }, 3000);
}

const icons = {
    success: <CheckCircle size={20} weight="fill" />,
    error: <XCircle size={20} weight="fill" />,
    info: <Info size={20} weight="fill" />,
};

export default function ToastContainer() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        setToastsState = setItems;
        return () => { setToastsState = null; };
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="toast-container">
            {items.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {icons[t.type]}
                    {t.message}
                </div>
            ))}
        </div>
    );
}
