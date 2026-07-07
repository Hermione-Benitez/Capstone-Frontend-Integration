import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Buttons";
import "./ConfirmModal.css";
export const ConfirmModal = ({ isOpen, title, message, variant = "primary", cancelLabel = "Cancel", confirmLabel = "Confirm", onCancel, onConfirm, icon, requiredPasscode, passcodeValue = "", onPasscodeChange, loading = false, }) => {
    const containerRef = useRef(null);
    const cancelBtnRef = useRef(null);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    // Sync open states with transitions
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        }
        else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 180); // matches the 0.18s exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
    // Auto-focus on Cancel button for safety when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (cancelBtnRef.current) {
                    cancelBtnRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen]);
    // Trap Escape key
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);
    // Trap Tab key inside the modal
    const handleKeyDown = (e) => {
        if (e.key !== "Tab" || !containerRef.current)
            return;
        const focusable = containerRef.current.querySelectorAll('button, input, textarea, select, [tabindex="0"]');
        if (focusable.length === 0)
            return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === firstEl) {
                lastEl.focus();
                e.preventDefault();
            }
        }
        else {
            if (document.activeElement === lastEl) {
                firstEl.focus();
                e.preventDefault();
            }
        }
    };
    if (!shouldRender)
        return null;
    const isDestructive = variant === "danger";
    const defaultIcon = isDestructive ? "ti-alert-triangle" : "ti-info-circle";
    const resolvedIcon = icon || defaultIcon;
    const isConfirmDisabled = requiredPasscode
        ? passcodeValue.trim() !== requiredPasscode
        : false;
    return createPortal(_jsx("div", { className: `dt-overlay${isClosing ? " closing" : ""}`, role: "dialog", "aria-modal": "true", onClick: onCancel, onKeyDown: handleKeyDown, children: _jsxs("div", { className: `dt-dialog${isClosing ? " closing" : ""}`, ref: containerRef, onClick: (e) => e.stopPropagation(), style: {
                borderColor: isDestructive ? "var(--err-r)" : "var(--teal-ring)",
            }, children: [_jsx("div", { className: "dt-dialog-icon", style: {
                        background: isDestructive ? "var(--err-bg)" : "var(--teal-bg)",
                        color: isDestructive ? "var(--err)" : "var(--teal)",
                    }, children: _jsx("i", { className: `ti ${resolvedIcon}`, "aria-hidden": "true" }) }), _jsx("h3", { className: "dt-dialog-title", style: { fontFamily: "var(--fh)" }, children: title }), _jsx("p", { className: "dt-dialog-msg", children: message }), requiredPasscode && (_jsxs("div", { className: "ab-form-group", style: { marginTop: "16px", textAlign: "left" }, children: [_jsxs("label", { className: "tf-label", style: {
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "var(--ts)",
                                marginBottom: "6px",
                                display: "block",
                            }, children: ["Type ", _jsx("strong", { style: { color: "var(--tp)" }, children: requiredPasscode }), " to confirm"] }), _jsx("input", { type: "text", className: "tf-input", style: {
                                width: "100%",
                                height: "36px",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--r-xs)",
                                padding: "0 10px",
                                fontSize: "13px",
                            }, value: passcodeValue, onChange: (e) => onPasscodeChange?.(e.target.value), placeholder: `Type "${requiredPasscode}"`, autoFocus: true, disabled: loading })] })), _jsxs("div", { className: "dt-dialog-actions", style: { marginTop: "24px" }, children: [_jsx("button", { ref: cancelBtnRef, className: "btn btn--secondary btn--sm", onClick: onCancel, disabled: loading, children: cancelLabel }), _jsx(Button, { title: confirmLabel, variant: variant, size: "sm", disabled: isConfirmDisabled, loading: loading, onClick: onConfirm })] })] }) }), document.body);
};
export default ConfirmModal;
//# sourceMappingURL=ConfirmModal.js.map