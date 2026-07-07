import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "./ToastContext";
import "./ToastBar.css";
export const ToastBar = () => {
    const { toasts, dismissToast } = useToast();
    const handleAction = (toast) => {
        if (toast.onAction) {
            toast.onAction();
        }
        dismissToast(toast.id);
    };
    return (_jsx("div", { className: "tb-toast-wrapper", role: "region", "aria-label": "Notifications", children: toasts.map((toast) => {
            const isPersistent = toast.type === "error" && toast.duration === undefined;
            const showProgress = !isPersistent && toast.duration !== 0;
            const durationMs = toast.duration !== undefined ? toast.duration : (toast.type === "warning" ? 6000 : 4000);
            return (_jsxs("div", { className: `tb-toast-item tb-${toast.type} ${toast.isLeaving ? "tb-toast-leave" : "tb-toast-enter"}`, role: toast.type === "error" ? "alert" : "status", "aria-live": toast.type === "error" ? "assertive" : "polite", "aria-atomic": "true", children: [_jsxs("div", { className: "tb-toast-icon", children: [toast.type === "success" && _jsx(CheckCircle2, { size: 18, strokeWidth: 2.5 }), toast.type === "info" && _jsx(Info, { size: 18, strokeWidth: 2.5 }), toast.type === "warning" && _jsx(AlertTriangle, { size: 18, strokeWidth: 2.5 }), toast.type === "error" && _jsx(XCircle, { size: 18, strokeWidth: 2.5 })] }), _jsxs("div", { className: "tb-toast-content", children: [_jsx("h4", { className: "tb-toast-title", children: toast.title }), _jsx("p", { className: "tb-toast-msg", children: toast.message }), toast.actionLabel && (_jsx("button", { className: "tb-toast-action-btn", onClick: () => handleAction(toast), children: toast.actionLabel }))] }), _jsx("button", { className: "tb-toast-close", onClick: () => dismissToast(toast.id), "aria-label": "Close notification", children: "\u2715" }), showProgress && durationMs > 0 && (_jsx("div", { className: "tb-toast-progress", style: { animationDuration: `${durationMs}ms` } }))] }, toast.id));
        }) }));
};
export default ToastBar;
//# sourceMappingURL=ToastBar.js.map