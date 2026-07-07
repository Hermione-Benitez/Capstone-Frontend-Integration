import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useRef } from "react";
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const queueRef = useRef([]);
    const dismissToast = useCallback((id) => {
        // 1. Mark as leaving to trigger exit animations
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)));
        // 2. Remove completely after animation finishes (300ms)
        setTimeout(() => {
            setToasts((prev) => {
                const filtered = prev.filter((t) => t.id !== id);
                // 3. Pop the next toast from the queue if screen has capacity
                if (queueRef.current.length > 0 && filtered.length < 3) {
                    const nextToast = queueRef.current.shift();
                    startTimer(nextToast.id, nextToast.type, nextToast.duration);
                    return [...filtered, nextToast];
                }
                return filtered;
            });
        }, 300);
    }, []);
    const startTimer = useCallback((id, type, duration) => {
        // 0 = persistent
        if (duration === 0)
            return;
        // Default fallback durations: warning = 6000ms, error = persistent (0), success/info = 4000ms
        const finalDuration = duration !== undefined
            ? duration
            : (type === "error" ? 0 : (type === "warning" ? 6000 : 4000));
        if (finalDuration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, finalDuration);
        }
    }, [dismissToast]);
    const triggerToast = useCallback((type, title, message, actionLabel, onAction, duration) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            type,
            title,
            message,
            isLeaving: false,
            duration,
            actionLabel,
            onAction,
        };
        setToasts((prev) => {
            // limit visible stack to 3 at once
            if (prev.length < 3) {
                startTimer(id, type, duration);
                return [...prev, newToast];
            }
            else {
                // buffer to queue
                queueRef.current.push(newToast);
                return prev;
            }
        });
    }, [startTimer]);
    return (_jsx(ToastContext.Provider, { value: { toasts, triggerToast, dismissToast }, children: children }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    const { triggerToast } = context;
    const success = useCallback((message, title = "Success", actionLabel, onAction, duration) => {
        triggerToast("success", title, message, actionLabel, onAction, duration);
    }, [triggerToast]);
    const error = useCallback((message, title = "Error", actionLabel, onAction, duration) => {
        triggerToast("error", title, message, actionLabel, onAction, duration);
    }, [triggerToast]);
    const info = useCallback((message, title = "Info", actionLabel, onAction, duration) => {
        triggerToast("info", title, message, actionLabel, onAction, duration);
    }, [triggerToast]);
    const warning = useCallback((message, title = "Warning", actionLabel, onAction, duration) => {
        triggerToast("warning", title, message, actionLabel, onAction, duration);
    }, [triggerToast]);
    return {
        toasts: context.toasts,
        dismissToast: context.dismissToast,
        triggerToast,
        toast: {
            success,
            error,
            info,
            warning,
        },
    };
};
//# sourceMappingURL=ToastContext.js.map