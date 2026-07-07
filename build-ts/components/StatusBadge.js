import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, ArrowRightCircle, AlertCircle, XCircle, Ban, UserCircle } from 'lucide-react';
import './StatusBadge.css';
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
    const normalized = status.toString().toLowerCase().trim();
    let tier = 'neutral';
    // 1. Specific aging ranges (Days check)
    if (normalized.includes('90+') || normalized.includes('90') || normalized === 'overdue') {
        tier = 'danger';
    }
    else if (normalized.includes('60-90') || normalized.includes('60 - 90')) {
        tier = 'warn-danger';
    }
    else if (normalized.includes('30-60') || normalized.includes('30 - 60')) {
        tier = 'warning';
    }
    // 2. Critical / Negative / Fallbacks
    else if (['failed', 'outflow'].includes(normalized)) {
        tier = 'danger';
    }
    // 3. Positive / Success
    else if (['active', 'done', 'delivered', 'success', 'completed', 'paid', 'inflow'].includes(normalized)) {
        tier = 'success';
    }
    // 4. Informative / In-Progress
    else if (['in transit', 'submitted', 'picked-up', 'out of delivery', 'out for delivery'].includes(normalized)) {
        tier = 'info';
    }
    // 5. Attention / Pending / Fallback day checks
    else if (['pending', 'preparing', 'ready for pickup', 'processing', 'returning', 'not submitted', 'partially paid'].includes(normalized) ||
        normalized.includes('days') || normalized.includes('day')) {
        tier = 'warning';
    }
    // 6. Assignment / Ownership
    else if (['assigned', 'new payment'].includes(normalized)) {
        tier = 'assign';
    }
    // 7. Neutral / Terminated
    else if (['deactivated', 'cancelled', 'returned'].includes(normalized)) {
        tier = 'neutral';
    }
    // Get matching icon and configurations
    const renderIcon = () => {
        const iconSize = size === 'sm' ? 10 : 12;
        switch (tier) {
            case 'success':
                return _jsx(CheckCircle2, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'info':
                return _jsx(ArrowRightCircle, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'warning':
                return _jsx(AlertCircle, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'warn-danger':
                return _jsx(AlertCircle, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'danger':
                return _jsx(XCircle, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'assign':
                return _jsx(UserCircle, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
            case 'neutral':
            default:
                return _jsx(Ban, { size: iconSize, strokeWidth: 2.5, className: "badge-icon" });
        }
    };
    const sizeClass = size === 'sm' ? 'badge-sm' : '';
    return (_jsxs("span", { className: `badge badge-${tier} ${sizeClass} ${className}`, children: [renderIcon(), _jsx("span", { className: "badge-label", children: status })] }));
};
export default StatusBadge;
//# sourceMappingURL=StatusBadge.js.map