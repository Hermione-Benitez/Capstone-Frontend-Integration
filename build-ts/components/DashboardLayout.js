import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardList, Package, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';
import './DashboardLayout.css';
import './FormModals.css';
import StatusCard from './StatusCard';
import { CalendarRangePicker } from './FormModals';
/**
 * ─── SPEEDEX Graph Color Tokens (Stakeholder-Friendly) ───
 */
const C = {
    success: 'var(--chart-success, #00A99D)', // Delivered / Completed (Teal)
    info: 'var(--chart-info, #0284C7)', // In Transit (Blue)
    warning: 'var(--chart-warning, #D97706)', // Pending / Preparing (Amber)
    failed: 'var(--chart-failed, #DC2626)', // Critical / Failed (Red)
    neutral: 'var(--chart-neutral, #64748B)', // Returned / Cancelled (Grey)
    // 10-Color Sequential Teal Scale for multi-series line charts
    teal50: 'var(--chart-teal-50, #E6FAF8)',
    teal100: 'var(--chart-teal-100, #CCF5F0)',
    teal200: 'var(--chart-teal-200, #99EAE0)',
    teal300: 'var(--chart-teal-300, #66E0D1)',
    teal400: 'var(--chart-teal-400, #33D5C2)',
    teal500: 'var(--chart-teal-500, #00A99D)',
    teal600: 'var(--chart-teal-600, #009189)',
    teal700: 'var(--chart-teal-700, #007A72)',
    teal800: 'var(--chart-teal-800, #00625B)',
    teal900: 'var(--chart-teal-900, #004B46)',
};
/* ─── Static demo data fallbacks ─── */
const weeklyDataDefault = [
    { day: 'Mon', deliveries: 42, returned: 3, failed: 2 },
    { day: 'Tue', deliveries: 58, returned: 5, failed: 1 },
    { day: 'Wed', deliveries: 35, returned: 2, failed: 4 },
    { day: 'Thu', deliveries: 71, returned: 7, failed: 3 },
    { day: 'Fri', deliveries: 63, returned: 4, failed: 2 },
    { day: 'Sat', deliveries: 29, returned: 1, failed: 1 },
    { day: 'Sun', deliveries: 14, returned: 0, failed: 0 },
];
const todayDataDefault = [
    { day: '8:00 AM', deliveries: 12, returned: 1, failed: 0 },
    { day: '11:00 AM', deliveries: 25, returned: 2, failed: 1 },
    { day: '2:00 PM', deliveries: 32, returned: 3, failed: 2 },
    { day: '5:00 PM', deliveries: 18, returned: 1, failed: 0 },
    { day: '8:00 PM', deliveries: 8, returned: 0, failed: 1 },
];
const thirtyDayDataDefault = [
    { day: 'Wk 1', deliveries: 180, returned: 12, failed: 8 },
    { day: 'Wk 2', deliveries: 220, returned: 15, failed: 5 },
    { day: 'Wk 3', deliveries: 195, returned: 10, failed: 12 },
    { day: 'Wk 4', deliveries: 245, returned: 18, failed: 6 },
];
const customDataDefault = [
    { day: 'Range A', deliveries: 90, returned: 5, failed: 3 },
    { day: 'Range B', deliveries: 140, returned: 8, failed: 7 },
];
const pieDataDefault = [
    { name: 'Delivered', value: 214, color: C.success },
    { name: 'In Transit', value: 67, color: C.info },
    { name: 'Pending', value: 43, color: C.warning },
    { name: 'Failed', value: 18, color: C.failed },
    { name: 'Returned', value: 12, color: C.neutral },
];
const activityFeedDefault = [
    { id: 1, text: 'Waybill SP-78921 delivered to Maria Santos', time: '2 mins ago', color: C.success },
    { id: 2, text: 'Waybill SP-78888 picked up by Driver Reyes', time: '14 mins ago', color: C.info },
    { id: 3, text: 'Waybill SP-78790 marked as Failed', time: '32 mins ago', color: C.failed },
    { id: 4, text: 'New order SP-79001 submitted by Client BDO', time: '1 hr ago', color: C.warning },
    { id: 5, text: 'Waybill SP-78811 returned to warehouse', time: '2 hrs ago', color: C.neutral },
];
const statCardsDefault = [
    {
        label: 'Active Tasks',
        value: '110',
        sub: 'Pending & In-Transit',
        iconBg: 'rgba(217, 119, 6, 0.1)',
        iconColor: C.warning,
        accent: C.warning,
    },
    {
        label: 'Completed Today',
        value: '214',
        sub: 'Total successful deliveries',
        iconBg: 'rgba(5, 150, 105, 0.1)',
        iconColor: '#059669',
        accent: '#059669',
    },
    {
        label: 'In Transit',
        value: '67',
        sub: 'Currently on-road',
        iconBg: 'rgba(2, 132, 199, 0.1)',
        iconColor: C.info,
        accent: C.info,
    },
    {
        label: 'Failed / Returned',
        value: '30',
        sub: 'Needs attention',
        iconBg: 'rgba(220, 38, 38, 0.1)',
        iconColor: C.failed,
        accent: C.failed,
    },
];
const systemStatusDefault = [
    {
        name: 'Operation System',
        detail: '24 employees active',
        iconBg: 'rgba(0, 169, 157, 0.08)',
        iconColor: C.success,
    },
    {
        name: 'Delivery Management',
        detail: '354 total orders',
        iconBg: 'rgba(220, 38, 38, 0.1)',
        iconColor: C.failed,
    },
    {
        name: 'Delivery Tracker',
        detail: '67 active shipments',
        iconBg: 'rgba(5, 150, 105, 0.1)',
        iconColor: '#059669',
    },
];
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length)
        return null;
    return (_jsxs("div", { style: {
            background: '#FFFFFF',
            border: '1px solid #DDE2EB',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
            fontSize: '0.8rem',
            fontFamily: "var(--fb, sans-serif)",
        }, children: [_jsx("div", { style: { fontWeight: 700, color: '#0F172A', marginBottom: '6px' }, children: label }), payload.map((p) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' } }), _jsxs("span", { style: { color: '#475569' }, children: [p.name, ":"] }), _jsx("span", { style: { fontWeight: 700, color: '#0F172A' }, children: p.value })] }, p.name)))] }));
};
export const DashboardLayout = ({ weeklyData, pieData, activityFeed, loading: loadingProp, error: errorProp, onRetry, }) => {
    const [dateRange, setDateRange] = useState('7d');
    const [customStart, setCustomStart] = useState('2026-07-01');
    const [customEnd, setCustomEnd] = useState('2026-07-07');
    // Simulated Local Demo States (for interactive showcase)
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    // Combine parent controls or local demo controls
    const isLoading = loadingProp || localLoading;
    const isError = errorProp || localError;
    // Track window resizing for legend responsiveness
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const handleRetrySimulation = () => {
        if (onRetry) {
            onRetry();
        }
        else {
            setLocalError(null);
            setLocalLoading(true);
            setTimeout(() => {
                setLocalLoading(false);
            }, 1000);
        }
    };
    const handleRangeChange = (range) => {
        setDateRange(range);
        setLocalLoading(true);
        setTimeout(() => {
            setLocalLoading(false);
        }, 600);
    };
    // Compute active bar chart dataset based on selected date filter
    const activeBarData = useMemo(() => {
        if (weeklyData && dateRange === '7d')
            return weeklyData;
        switch (dateRange) {
            case 'today':
                return todayDataDefault;
            case '30d':
                return thirtyDayDataDefault;
            case 'custom': {
                try {
                    const start = new Date(customStart);
                    const end = new Date(customEnd);
                    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                        return customDataDefault;
                    }
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 14); // limit to 14 days
                    const generated = [];
                    const current = new Date(start);
                    for (let i = 0; i < diffDays; i++) {
                        const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        // Deterministic chart values based on charcodes
                        const hash = label.charCodeAt(0) + label.charCodeAt(label.length - 1) + i;
                        const deliveries = 25 + (hash % 50);
                        const returned = Math.floor((hash % 8) / 2);
                        const failed = Math.floor((hash % 6) / 2);
                        generated.push({
                            day: label,
                            deliveries,
                            returned,
                            failed
                        });
                        current.setDate(current.getDate() + 1);
                    }
                    return generated;
                }
                catch (e) {
                    return customDataDefault;
                }
            }
            case '7d':
            default:
                return weeklyDataDefault;
        }
    }, [dateRange, weeklyData, customStart, customEnd]);
    const activePieData = pieData || pieDataDefault;
    const activeFeed = activityFeed || activityFeedDefault;
    // ─── Rendering Skeletons ───
    const renderStatCardSkeleton = (key) => (_jsx(StatusCard, { label: "", value: "", loading: true }, key));
    const renderChartSkeleton = (title) => (_jsxs("div", { className: "spx-card spx-skeleton-card", children: [_jsx("div", { className: "spx-card-title", children: _jsx("div", { className: "spx-card-title-left", children: _jsx("div", { className: "spx-skeleton", style: { width: 120, height: 16 } }) }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }, children: [_jsx("div", { className: "spx-skeleton", style: { width: '100%', height: 180 } }), _jsxs("div", { style: { display: 'flex', gap: 16, justifyContent: 'center' }, children: [_jsx("div", { className: "spx-skeleton", style: { width: 60, height: 12 } }), _jsx("div", { className: "spx-skeleton", style: { width: 60, height: 12 } }), _jsx("div", { className: "spx-skeleton", style: { width: 60, height: 12 } })] })] })] }));
    const renderErrorState = (title) => (_jsxs("div", { className: "spx-card spx-error-card", children: [_jsx("div", { className: "spx-card-title", children: _jsxs("div", { className: "spx-card-title-left", children: [_jsx(AlertCircle, { size: 18, color: C.failed }), title] }) }), _jsxs("div", { className: "spx-error-content", children: [_jsx(AlertCircle, { size: 38, className: "spx-error-icon" }), _jsx("h3", { children: "Failed to fetch dashboard metrics" }), _jsx("p", { children: "There was a connection timeout while fetching metrics. Please check your network and try again." }), _jsxs("button", { className: "spx-retry-btn", onClick: handleRetrySimulation, children: [_jsx(RefreshCw, { size: 12, style: { marginRight: 6 } }), "Retry Sync"] })] })] }));
    return (_jsxs("div", { className: "speedex-dashboard", children: [isError ? (
            // Error State UI Showcase
            _jsxs(_Fragment, { children: [_jsx("div", { className: "spx-stats-grid", children: statCardsDefault.map((_, idx) => renderStatCardSkeleton(idx)) }), _jsxs("div", { className: "spx-main-grid", children: [renderErrorState("Delivery Performance"), _jsx("div", { className: "spx-card spx-skeleton-card", children: _jsx("div", { className: "spx-skeleton", style: { width: '100%', height: '100%', minHeight: 200 } }) })] })] })) : isLoading ? (
            // Shimmering Skeletons UI Showcase
            _jsxs(_Fragment, { children: [_jsx("div", { className: "spx-stats-grid", children: [0, 1, 2, 3].map((idx) => renderStatCardSkeleton(idx)) }), _jsxs("div", { className: "spx-main-grid", children: [renderChartSkeleton("Delivery Performance"), _jsx("div", { className: "spx-card spx-skeleton-card", children: _jsx("div", { className: "spx-skeleton", style: { width: '100%', height: '100%', minHeight: 200 } }) })] })] })) : (
            // Normal Loaded UI Showcase
            _jsxs(_Fragment, { children: [_jsx("div", { className: "spx-stats-grid", children: statCardsDefault.map((card, idx) => {
                            let variantName = 'warning';
                            let iconClass = 'ti ti-list-details';
                            let trendObj = { value: '8.2%', type: 'up' };
                            let sparkData = [15, 22, 34, 18, 42, 30, 25];
                            if (idx === 1) {
                                variantName = 'success';
                                iconClass = 'ti ti-circle-check';
                                trendObj = { value: '14.5%', type: 'up' };
                                sparkData = [40, 50, 48, 62, 70, 85, 90];
                            }
                            else if (idx === 2) {
                                variantName = 'info';
                                iconClass = 'ti ti-truck';
                                trendObj = { value: '2.1%', type: 'down' };
                                sparkData = [10, 18, 25, 20, 30, 22, 18];
                            }
                            else if (idx === 3) {
                                variantName = 'danger';
                                iconClass = 'ti ti-alert-triangle';
                                trendObj = { value: '1.5%', type: 'neutral' };
                                sparkData = [5, 4, 8, 3, 6, 2, 4];
                            }
                            return (_jsx(StatusCard, { label: card.label, value: card.value, icon: iconClass, variant: variantName, trend: trendObj, periodText: "vs yesterday", sparklineData: sparkData }, card.label));
                        }) }), _jsxs("div", { className: "spx-main-grid", children: [_jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(TrendingUp, { size: 18, color: "#00A99D" }), "Delivery Performance"] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsx("div", { className: "spx-date-filter-group", style: { margin: 0 }, children: ['today', '7d', '30d', 'custom'].map((range) => (_jsx("button", { className: `spx-date-filter-btn ${dateRange === range ? 'active' : ''}`, onClick: () => handleRangeChange(range), style: { padding: '4px 8px', fontSize: '0.72rem' }, children: range === 'today' ? 'Today' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'Custom' }, range))) }), dateRange === 'custom' && (_jsx("div", { style: { width: '260px' }, children: _jsx(CalendarRangePicker, { startValue: customStart, endValue: customEnd, compact: true, onRangeChange: (start, end) => {
                                                                setCustomStart(start);
                                                                if (end) {
                                                                    setCustomEnd(end);
                                                                    setLocalLoading(true);
                                                                    setTimeout(() => setLocalLoading(false), 250);
                                                                }
                                                            } }) })), _jsx("span", { className: "spx-badge spx-badge-transit", style: { padding: '3px 8px' }, children: dateRange === 'today' ? 'Today' : dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : 'Custom Range' })] })] }), _jsxs("div", { className: "spx-legend", children: [_jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.success } }), "Deliveries"] }), _jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.neutral } }), "Returned"] }), _jsxs("div", { className: "spx-legend-item", children: [_jsx("div", { className: "spx-legend-dot", style: { background: C.failed } }), "Failed"] })] }), _jsx("div", { style: { width: '100%', height: 220 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: activeBarData, barGap: 4, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#EBF0F5" }), _jsx(XAxis, { dataKey: "day", axisLine: false, tickLine: false, tick: { fontSize: 11, fill: '#64748B', fontWeight: 600, fontFamily: 'var(--fb, sans-serif)' } }), _jsx(Tooltip, { content: _jsx(BarTooltip, {}), cursor: { fill: 'rgba(0, 169, 157, 0.03)' } }), _jsx(Bar, { dataKey: "deliveries", name: "Deliveries", fill: C.success, radius: [4, 4, 0, 0], maxBarSize: 32 }), _jsx(Bar, { dataKey: "returned", name: "Returned", fill: C.neutral, radius: [4, 4, 0, 0], maxBarSize: 32 }), _jsx(Bar, { dataKey: "failed", name: "Failed", fill: C.failed, radius: [4, 4, 0, 0], maxBarSize: 32 })] }) }) })] }), _jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(ClipboardList, { size: 18, color: "#00A99D" }), "Recent Activity"] }), _jsx("span", { className: "spx-badge spx-badge-transit", children: "Live" })] }), activeFeed.map((log) => (_jsxs("div", { className: "spx-feed-item", children: [_jsx("div", { className: "spx-feed-dot", style: { background: log.color } }), _jsxs("div", { children: [_jsx("div", { className: "spx-feed-text", children: log.text }), _jsx("div", { className: "spx-feed-time", children: log.time })] })] }, log.id)))] })] })] })), _jsxs("div", { className: "spx-bottom-grid", children: [_jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(Package, { size: 18, color: "#00A99D" }), "Order Status Breakdown"] }), _jsx("span", { className: "spx-badge spx-badge-pending", children: "All Time" })] }), _jsx("div", { style: { width: '100%', height: 220 }, children: isLoading ? (_jsx("div", { className: "spx-skeleton", style: { width: '100%', height: '100%' } })) : isError ? (_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }, children: "Metrics unavailable" })) : (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: activePieData, cx: isMobile ? "50%" : "40%", cy: "50%", innerRadius: 52, outerRadius: 84, paddingAngle: 3, dataKey: "value", children: activePieData.map((entry, i) => (_jsx(Cell, { fill: entry.color }, i))) }), _jsx(Tooltip, { formatter: (val, name) => [`${val} orders`, name], contentStyle: {
                                                    fontSize: '0.8rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #DDE2EB',
                                                    boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)',
                                                    fontFamily: 'var(--fb, sans-serif)',
                                                } }), _jsx(Legend, { layout: isMobile ? "horizontal" : "vertical", align: isMobile ? "center" : "right", verticalAlign: isMobile ? "bottom" : "middle", iconType: "circle", iconSize: 8, wrapperStyle: isMobile ? { paddingTop: 10 } : undefined, formatter: (value) => (_jsx("span", { style: { fontSize: '0.78rem', color: '#475569', fontWeight: 500, fontFamily: 'var(--fb, sans-serif)' }, children: value })) })] }) })) })] }), _jsxs("div", { className: "spx-card", children: [_jsxs("div", { className: "spx-card-title", children: [_jsxs("div", { className: "spx-card-title-left", children: [_jsx(TrendingUp, { size: 18, color: "#00A99D" }), "System Status"] }), _jsx("span", { className: "spx-badge spx-badge-active", children: "All Operational" })] }), isLoading ? (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [0, 1, 2].map((idx) => (_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsx("div", { className: "spx-skeleton", style: { width: 36, height: 36 } }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { className: "spx-skeleton", style: { width: '40%', height: 12, marginBottom: 6 } }), _jsx("div", { className: "spx-skeleton", style: { width: '60%', height: 10 } })] })] }, idx))) })) : (systemStatusDefault.map((s, idx) => {
                                // Extract icon based on index
                                let iconEl = _jsx(Users, { size: 16 });
                                if (idx === 1)
                                    iconEl = _jsx(ClipboardList, { size: 16 });
                                if (idx === 2)
                                    iconEl = _jsx(Package, { size: 16 });
                                return (_jsxs("div", { className: "spx-system-item", children: [_jsx("div", { className: "spx-system-icon", style: { background: s.iconBg, color: s.iconColor }, children: iconEl }), _jsxs("div", { children: [_jsx("div", { className: "spx-system-name", children: s.name }), _jsx("div", { className: "spx-system-detail", children: s.detail })] }), _jsx("span", { className: "spx-system-uptime", children: "99.9%" })] }, s.name));
                            }))] })] })] }));
};
export default DashboardLayout;
//# sourceMappingURL=DashboardLayout.js.map