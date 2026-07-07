import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from "react";
import { Bell, CheckCheck, Trash2, Check, Eye, AlertTriangle, CheckCircle2, Info, Settings, } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConfirmModal from "./ConfirmModal";
import "./Notifications.css";
// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_NOTIFICATIONS = [
    {
        id: "1",
        title: "Delivery Failed",
        description: "Delivery attempt failed in Makati for Juan Dela Cruz. Rider could not locate address.",
        timestamp: "10:32 AM",
        date: "Today",
        read: false,
        type: "alert",
        waybillNo: "SP-77291",
        statusBadge: "Failed",
        source: "DMS Auto-Alert",
    },
    {
        id: "2",
        title: "SLA Breach Warning",
        description: "Route #8 is running 35 mins behind schedule. SLA impact imminent for 3 orders.",
        timestamp: "9:15 AM",
        date: "Today",
        read: false,
        type: "alert",
        waybillNo: "SP-80124",
        statusBadge: "At Risk",
        source: "TARS Monitor",
    },
    {
        id: "3",
        title: "Order Delivered",
        description: "Package successfully delivered to Sofia Martinez in Quezon City.",
        timestamp: "8:45 AM",
        date: "Today",
        read: false,
        type: "success",
        waybillNo: "SP-77288",
        statusBadge: "Delivered",
        source: "DMS",
    },
    {
        id: "4",
        title: "New Route Manifest",
        description: "Waybill SP-77291 assigned to driver Juan dela Cruz for afternoon dispatch.",
        timestamp: "7:00 AM",
        date: "Today",
        read: true,
        type: "info",
        waybillNo: "SP-77291",
        statusBadge: "Assigned",
        source: "DMS",
    },
    {
        id: "5",
        title: "Invoice Settlement Failed",
        description: "Vendor payout to FastTrack Cargo rejected by bank. Amount: PHP 45,000.",
        timestamp: "Yesterday, 4:30 PM",
        date: "Yesterday",
        read: false,
        type: "alert",
        waybillNo: "INV-2024-088",
        statusBadge: "Failed",
        source: "FinSys",
    },
    {
        id: "6",
        title: "Fleet Report Available",
        description: "Weekly dispatch efficiency audit is ready for download. Coverage: March 1-7.",
        timestamp: "Yesterday, 2:00 PM",
        date: "Yesterday",
        read: true,
        type: "success",
        source: "TARS Analytics",
    },
    {
        id: "7",
        title: "Vehicle Maintenance Complete",
        description: "Truck Plate TX-492 cleared for long-haul duty after scheduled servicing.",
        timestamp: "Yesterday, 11:00 AM",
        date: "Yesterday",
        read: true,
        type: "info",
        source: "Fleet Ops",
    },
    {
        id: "8",
        title: "System Security Update",
        description: "Workspace session policies updated. All active sessions refreshed automatically.",
        timestamp: "March 3, 2025",
        date: "March 3, 2025",
        read: true,
        type: "system",
        source: "IT Security",
    },
    {
        id: "9",
        title: "Password Policy Updated",
        description: "All users must update passwords within 14 days per new compliance directive.",
        timestamp: "March 2, 2025",
        date: "March 2, 2025",
        read: true,
        type: "system",
        source: "IT Security",
    },
];
// ─── Component ─────────────────────────────────────────────────────────────────
export const Notifications = ({ initialData, onViewOrder, }) => {
    const [notifications, setNotifications] = useState(initialData ?? SAMPLE_NOTIFICATIONS);
    const [activeTab, setActiveTab] = useState("all");
    const [selectedId, setSelectedId] = useState("");
    const [checkedIds, setCheckedIds] = useState([]);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    // ── Derived data ────────────────────────────────────────────────────────────
    const selected = useMemo(() => notifications.find((n) => n.id === selectedId) ?? null, [notifications, selectedId]);
    const filtered = useMemo(() => {
        if (activeTab === "all")
            return notifications;
        if (activeTab === "read")
            return notifications.filter((n) => n.read);
        return notifications.filter((n) => n.type === activeTab && !n.read);
    }, [notifications, activeTab]);
    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
    const tabs = useMemo(() => [
        { key: "all", label: "All" },
        { key: "alert", label: "Alerts", count: notifications.filter((n) => n.type === "alert" && !n.read).length },
        { key: "success", label: "Success", count: notifications.filter((n) => n.type === "success" && !n.read).length },
        { key: "system", label: "System", count: notifications.filter((n) => n.type === "system" && !n.read).length },
        { key: "read", label: "Read" },
    ], [notifications]);
    // Group by date
    const grouped = useMemo(() => {
        return filtered.reduce((acc, n) => {
            if (!acc[n.date])
                acc[n.date] = [];
            acc[n.date].push(n);
            return acc;
        }, {});
    }, [filtered]);
    // ── Actions ─────────────────────────────────────────────────────────────────
    const markNotificationRead = useCallback((id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);
    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);
    const deleteNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedId === id)
            setSelectedId("");
    }, [selectedId]);
    const clearAll = useCallback(() => {
        setNotifications([]);
        setSelectedId("");
        setCheckedIds([]);
        setShowClearConfirm(false);
    }, []);
    const handleToggleCheck = useCallback((e, id) => {
        e.stopPropagation();
        setCheckedIds((prev) => prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]);
    }, []);
    const handleMarkCheckedAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => (checkedIds.includes(n.id) ? { ...n, read: true } : n)));
        setCheckedIds([]);
    }, [checkedIds]);
    const handleDeleteChecked = useCallback(() => {
        setNotifications((prev) => prev.filter((n) => !checkedIds.includes(n.id)));
        if (checkedIds.includes(selectedId))
            setSelectedId("");
        setCheckedIds([]);
    }, [checkedIds, selectedId]);
    // ── Type icon helper ────────────────────────────────────────────────────────
    const TypeIcon = ({ type, size = 18 }) => {
        switch (type) {
            case "alert": return _jsx(AlertTriangle, { size: size });
            case "success": return _jsx(CheckCircle2, { size: size });
            case "system": return _jsx(Settings, { size: size });
            default: return _jsx(Info, { size: size });
        }
    };
    // ── Render ──────────────────────────────────────────────────────────────────
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "notif-actions-row", children: [_jsxs("button", { className: "btn btn-outline btn-sm", onClick: markAllAsRead, disabled: unreadCount === 0, children: [_jsx(CheckCheck, { size: 14 }), " Mark all as read"] }), _jsxs("button", { className: "btn btn-outline btn-sm", onClick: () => setShowClearConfirm(true), disabled: notifications.length === 0, children: [_jsx(Trash2, { size: 14 }), " Clear all"] }), _jsxs("span", { className: "notif-unread-count", children: [unreadCount, " unread notifications"] })] }), _jsxs("div", { className: "notif-layout", children: [_jsxs("div", { className: "notif-list-panel", children: [_jsx("div", { className: "notif-tabs", children: tabs.map((tab) => (_jsxs("button", { className: `notif-tab ${activeTab === tab.key ? "active" : ""}`, onClick: () => setActiveTab(tab.key), children: [tab.label, tab.count !== undefined && tab.count > 0 && (_jsx("span", { className: "notif-tab-count", children: tab.count }))] }, tab.key))) }), _jsx("div", { className: "notif-list", children: filtered.length === 0 ? (_jsxs("div", { className: "notif-empty-state", children: [_jsx("div", { className: "notif-empty-icon", children: _jsx(Bell, { size: 28 }) }), _jsx("div", { className: "notif-empty-title", children: "No Notifications" }), _jsx("div", { className: "notif-empty-desc", children: activeTab === "all"
                                                ? "You don't have any notifications yet."
                                                : `No ${activeTab} notifications to show.` })] })) : (Object.entries(grouped).map(([date, items]) => (_jsxs("div", { children: [_jsx("div", { className: "notif-date-header", children: date.toUpperCase() }), items.map((n) => (_jsxs("div", { className: `notif-item ${selectedId === n.id ? "selected" : ""} ${!n.read ? "unread" : ""} ${checkedIds.includes(n.id) ? "checked" : ""}`, onClick: () => setSelectedId(n.id), children: [_jsx("input", { type: "checkbox", className: "notif-checkbox", checked: checkedIds.includes(n.id), onChange: (e) => handleToggleCheck(e, n.id), onClick: (e) => e.stopPropagation() }), _jsxs("div", { className: "notif-item-content", children: [_jsxs("div", { className: "notif-item-header", children: [_jsx("strong", { children: n.title }), n.waybillNo && _jsx("span", { className: "notif-waybill", children: n.waybillNo }), n.statusBadge && _jsx(StatusBadge, { status: n.statusBadge, size: "sm" })] }), _jsx("p", { className: "notif-item-desc", children: n.description }), _jsxs("span", { className: "notif-item-meta", children: [n.timestamp, " \u00B7 ", n.source] })] })] }, n.id)))] }, date)))) })] }), selected && (_jsxs("div", { className: "notif-detail-panel", children: [_jsxs("div", { className: "notif-detail-header", children: [_jsx("h3", { children: "Notification Detail" }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => setSelectedId(""), "aria-label": "Close detail", children: "\u2715" })] }), _jsxs("div", { className: "notif-detail-alert", children: [_jsx("div", { className: `notif-alert-icon ${selected.type === "alert" ? "" : selected.type}`, children: _jsx(TypeIcon, { type: selected.type }) }), _jsxs("div", { children: [_jsxs("span", { className: `notif-alert-type ${selected.type}`, children: [_jsx(TypeIcon, { type: selected.type, size: 14 }), selected.title.toUpperCase()] }), _jsxs("span", { className: "notif-detail-meta", children: [selected.timestamp, " \u00B7 ", selected.source] })] })] }), _jsxs("div", { className: "notif-detail-body", children: [_jsx("strong", { children: selected.title }), _jsx("p", { children: selected.description })] }), _jsxs("div", { className: "notif-summary-fields", children: [_jsxs("div", { className: "notif-summary-field", children: [_jsx("span", { className: "notif-summary-label", children: "Waybill No." }), _jsx("span", { className: "notif-summary-value waybill", children: selected.waybillNo || "—" })] }), _jsxs("div", { className: "notif-summary-field", children: [_jsx("span", { className: "notif-summary-label", children: "Alert Type" }), _jsx("span", { className: "notif-summary-value", children: selected.type })] }), _jsxs("div", { className: "notif-summary-field", children: [_jsx("span", { className: "notif-summary-label", children: "Source" }), _jsx("span", { className: "notif-summary-value", children: selected.source })] }), _jsxs("div", { className: "notif-summary-field", children: [_jsx("span", { className: "notif-summary-label", children: "Status" }), _jsx("span", { className: "notif-summary-value", children: selected.statusBadge ? _jsx(StatusBadge, { status: selected.statusBadge, size: "sm" }) : "—" })] })] }), _jsxs("div", { className: "notif-detail-actions", children: [_jsxs("button", { className: "btn btn-primary btn-sm", onClick: () => onViewOrder?.(selected), children: [_jsx(Eye, { size: 14 }), " View Order"] }), _jsxs("button", { className: "btn btn-outline btn-sm", onClick: () => markNotificationRead(selected.id), children: [_jsx(Check, { size: 14 }), " Mark Read"] }), _jsxs("button", { className: "btn btn-danger btn-sm", onClick: () => deleteNotification(selected.id), children: [_jsx(Trash2, { size: 14 }), " Delete"] })] })] }))] }), _jsxs("div", { className: `floating-selection-bar ${checkedIds.length > 0 ? "visible" : ""}`, children: [_jsxs("span", { className: "floating-selection-count", children: [checkedIds.length, " selected"] }), _jsxs("button", { className: "btn btn-sm", onClick: handleMarkCheckedAsRead, children: [_jsx(Check, { size: 14 }), " Mark read"] }), _jsxs("button", { className: "btn btn-sm btn-danger", onClick: handleDeleteChecked, children: [_jsx(Trash2, { size: 14 }), " Delete"] })] }), _jsx(ConfirmModal, { isOpen: showClearConfirm, title: "Clear all notifications?", message: "This will permanently delete all notifications. This action is irreversible.", variant: "danger", confirmLabel: "Clear Notifications", cancelLabel: "Cancel", icon: "ti-trash", onCancel: () => setShowClearConfirm(false), onConfirm: clearAll })] }));
};
export default Notifications;
//# sourceMappingURL=Notifications.js.map