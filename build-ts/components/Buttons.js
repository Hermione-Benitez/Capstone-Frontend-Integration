import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
// ─── Component ─────────────────────────────────────────────────────────────────
export const Button = forwardRef(function Button({ title, variant = "primary", size = "md", icon, iconPosition = "left", loading = false, fullWidth = false, iconOnly = false, disabled, className = "", children, ...rest }, ref) {
    const classes = [
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? "btn--full" : "",
        iconOnly ? "btn--icon-only" : "",
        className,
    ].filter(Boolean).join(" ");
    return (_jsxs("button", { ref: ref, type: "button", className: classes, disabled: disabled || loading, "aria-busy": loading || undefined, "aria-label": iconOnly ? title : undefined, ...rest, children: [loading && _jsx("i", { className: "ti ti-loader-2 btn-spinner", "aria-hidden": "true" }), !loading && icon && iconPosition === "left" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" })), !iconOnly && _jsx("span", { children: children ?? title }), !loading && icon && iconPosition === "right" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" }))] }));
});
export default Button;
//# sourceMappingURL=Buttons.js.map