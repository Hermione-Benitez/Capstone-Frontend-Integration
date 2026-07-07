import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { GlobalHeader, GlobalFooter, Button, Dropdown, DataTable, Sidebar, StatusCard, StatusBadge, DashboardLayout, FormModals, SearchBar, ConfirmModal, Notifications, ToastProvider, useToast, } from "./components";
import ToastBar from "./components/ToastBar";
import ActionButtons from "./components/ActionButtons";
const tableData = [
    { id: 1, name: "Juan Dela Cruz", role: "Driver", status: "Active" },
    { id: 2, name: "Maria Santos", role: "Logistics Coordinator", status: "Active" },
    { id: 3, name: "Carlos Reyes", role: "Driver", status: "Active" },
    { id: 4, name: "Angelica Tan", role: "Finance Officer", status: "Active" },
    { id: 5, name: "Roberto Mendoza", role: "Warehouse Staff", status: "Pending" },
    { id: 6, name: "Sofia Martinez", role: "Operations Manager", status: "Active" },
    { id: 7, name: "Diego Garcia", role: "Driver", status: "Deactivated" },
    { id: 8, name: "FirstName LastName", role: "Logistics Director", status: "Active" },
    { id: 9, name: "Paolo Villanueva", role: "Driver", status: "Active" },
    { id: 10, name: "Andrea Cruz", role: "Finance Auditor", status: "Active" },
    { id: 11, name: "Miguel Torres", role: "Warehouse Staff", status: "Active" },
    { id: 12, name: "Patricia Lim", role: "Operations Manager", status: "Active" },
    { id: 13, name: "Enrique Ramos", role: "Driver", status: "Pending" },
    { id: 14, name: "Clarissa Ong", role: "Logistics Coordinator", status: "Active" },
    { id: 15, name: "Fernando Aquino", role: "Driver", status: "Active" },
    { id: 16, name: "Bianca Navarro", role: "Finance Officer", status: "Active" },
    { id: 17, name: "Ricardo Flores", role: "Driver", status: "Deactivated" },
    { id: 18, name: "Gabriela Pascual", role: "Warehouse Staff", status: "Active" },
    { id: 19, name: "Vincent Castillo", role: "Driver", status: "Active" },
    { id: 20, name: "Samantha Dizon", role: "Logistics Coordinator", status: "Active" },
    { id: 21, name: "Antonio Bautista", role: "Driver", status: "Active" },
    { id: 22, name: "Jasmine Perez", role: "Finance Officer", status: "Pending" },
    { id: 23, name: "Marco Salazar", role: "Operations Manager", status: "Active" },
    { id: 24, name: "Nicole Reyes", role: "Warehouse Staff", status: "Active" },
    { id: 25, name: "Daniel Soriano", role: "Driver", status: "Active" },
    { id: 26, name: "Camille Velasco", role: "Logistics Coordinator", status: "Active" },
    { id: 27, name: "Rafael Santiago", role: "Driver", status: "Deactivated" },
    { id: 28, name: "Monica Aguilar", role: "Finance Auditor", status: "Active" },
    { id: 29, name: "Jose Mercado", role: "Driver", status: "Pending" },
    { id: 30, name: "Katrina David", role: "Operations Manager", status: "Active" },
    { id: 31, name: "Christopher Luna", role: "Warehouse Staff", status: "Active" },
    { id: 32, name: "Isabelle Fernandez", role: "Logistics Coordinator", status: "Active" },
    { id: 33, name: "Adrian Morales", role: "Driver", status: "Active" },
    { id: 34, name: "Regina Espiritu", role: "Finance Officer", status: "Active" },
    { id: 35, name: "Jonathan Cruz", role: "Driver", status: "Active" },
    { id: 36, name: "Teresa Valdez", role: "Warehouse Staff", status: "Pending" },
    { id: 37, name: "Manuel Rivera", role: "Driver", status: "Active" },
    { id: 38, name: "Angela Tolentino", role: "Logistics Director", status: "Active" },
    { id: 39, name: "Nathaniel Guevara", role: "Driver", status: "Deactivated" },
    { id: 40, name: "Christine Padilla", role: "Finance Officer", status: "Active" },
    { id: 41, name: "Alejandro Santos", role: "Operations Manager", status: "Active" },
    { id: 42, name: "Valerie Dela Rosa", role: "Logistics Coordinator", status: "Active" },
    { id: 43, name: "Francis Ilagan", role: "Driver", status: "Active" },
    { id: 44, name: "Denise Manalo", role: "Warehouse Staff", status: "Active" },
    { id: 45, name: "Joaquin Villareal", role: "Driver", status: "Pending" },
    { id: 46, name: "Mariana Custodio", role: "Finance Auditor", status: "Active" },
    { id: 47, name: "Benjamin Lacson", role: "Driver", status: "Active" },
    { id: 48, name: "Stephanie Almonte", role: "Logistics Coordinator", status: "Active" },
    { id: 49, name: "Gabriel Ocampo", role: "Driver", status: "Active" },
    { id: 50, name: "Arianne Chua", role: "Operations Manager", status: "Deactivated" },
    { id: 51, name: "Cesar Bernardo", role: "Driver", status: "Active" },
    { id: 52, name: "Joanne Ignacio", role: "Finance Officer", status: "Active" },
    { id: 53, name: "Lorenzo Pangilinan", role: "Warehouse Staff", status: "Active" },
    { id: 54, name: "Diana Quiambao", role: "Logistics Coordinator", status: "Pending" },
    { id: 55, name: "Ernesto Magbanua", role: "Driver", status: "Active" },
    { id: 56, name: "Pauline Roxas", role: "Finance Officer", status: "Active" },
    { id: 57, name: "Kevin Dimaculangan", role: "Driver", status: "Active" },
    { id: 58, name: "Vivian Legaspi", role: "Operations Manager", status: "Active" },
    { id: 59, name: "Patrick Monsalud", role: "Driver", status: "Deactivated" },
    { id: 60, name: "Kimberly Fajardo", role: "Warehouse Staff", status: "Active" },
    { id: 61, name: "Dominic Arevalo", role: "Driver", status: "Active" },
    { id: 62, name: "Hannah Caliboso", role: "Logistics Coordinator", status: "Active" },
    { id: 63, name: "Leo Magsaysay", role: "Driver", status: "Pending" },
    { id: 64, name: "Trisha Evangelista", role: "Finance Auditor", status: "Active" },
    { id: 65, name: "Samuel Villena", role: "Driver", status: "Active" },
    { id: 66, name: "Rochelle Balmaceda", role: "Operations Manager", status: "Active" },
    { id: 67, name: "Aldrich Pagsanjan", role: "Warehouse Staff", status: "Active" },
    { id: 68, name: "Giselle Tupaz", role: "Logistics Coordinator", status: "Active" },
    { id: 69, name: "Ivan Salamat", role: "Driver", status: "Active" },
    { id: 70, name: "Michelle Concepcion", role: "Finance Officer", status: "Deactivated" },
    { id: 71, name: "Troy Basconcillo", role: "Driver", status: "Active" },
    { id: 72, name: "Alyssa Batungbakal", role: "Logistics Coordinator", status: "Active" },
    { id: 73, name: "Ramon Panganiban", role: "Driver", status: "Pending" },
    { id: 74, name: "Darlene Crisostomo", role: "Warehouse Staff", status: "Active" },
    { id: 75, name: "Jeffrey Macapagal", role: "Operations Manager", status: "Active" },
    { id: 76, name: "Victoria Magalona", role: "Finance Officer", status: "Active" },
    { id: 77, name: "Andrei Resurrecion", role: "Driver", status: "Active" },
    { id: 78, name: "Monique Sarmiento", role: "Logistics Coordinator", status: "Active" },
    { id: 79, name: "Eduardo Bondoc", role: "Driver", status: "Deactivated" },
    { id: 80, name: "Janelle Policarpio", role: "Finance Auditor", status: "Active" },
    { id: 81, name: "Roberto Lacanlale", role: "Driver", status: "Active" },
    { id: 82, name: "Cynthia Marasigan", role: "Warehouse Staff", status: "Pending" },
    { id: 83, name: "Philip Atayde", role: "Driver", status: "Active" },
    { id: 84, name: "Lorraine Catacutan", role: "Operations Manager", status: "Active" },
    { id: 85, name: "Raymond Estrella", role: "Driver", status: "Active" },
    { id: 86, name: "Nadine Villaruel", role: "Logistics Coordinator", status: "Active" },
    { id: 87, name: "Oscar Baluyot", role: "Driver", status: "Active" },
    { id: 88, name: "Francesca Dimacali", role: "Finance Officer", status: "Active" },
    { id: 89, name: "Jericho Pantaleon", role: "Warehouse Staff", status: "Deactivated" },
    { id: 90, name: "Veronica Malabanan", role: "Logistics Coordinator", status: "Active" },
    { id: 91, name: "Ronaldo Talavera", role: "Driver", status: "Active" },
    { id: 92, name: "Erica Palomares", role: "Operations Manager", status: "Active" },
    { id: 93, name: "Alexis Coronel", role: "Driver", status: "Pending" },
    { id: 94, name: "Megan Capistrano", role: "Finance Officer", status: "Active" },
    { id: 95, name: "Victor Buenaventura", role: "Driver", status: "Active" },
    { id: 96, name: "Czarina Liwanag", role: "Warehouse Staff", status: "Active" },
    { id: 97, name: "Nelson Pagaduan", role: "Driver", status: "Active" },
    { id: 98, name: "Beatrice Sibal", role: "Logistics Director", status: "Active" },
    { id: 99, name: "Hector Lagrimas", role: "Driver", status: "Deactivated" },
    { id: 100, name: "Charlene Manalang", role: "Finance Auditor", status: "Active" },
];
const tableColumns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: true },
];
const dropdownItems = [
    { key: "edit", label: "Edit", variant: "default" },
    { key: "duplicate", label: "Duplicate", variant: "default" },
    { key: "delete", label: "Delete", variant: "danger" },
];
const rowActions = [
    {
        label: "Edit Details",
        icon: "ti-pencil",
        onClick: (row) => {
            // Replaced alert with toast notification
            const { triggerToast } = window.__toastHelpers || {};
            if (triggerToast) {
                triggerToast("info", "Edit Mode", `Opening edit portal for ${row.name}...`);
            }
            else {
                console.log(`Edit details clicked for ${row.name}`);
            }
        },
        variant: "default",
    },
    {
        label: "Duplicate Row",
        icon: "ti-copy",
        onClick: (row) => {
            // Replaced alert with toast notification
            const { triggerToast } = window.__toastHelpers || {};
            if (triggerToast) {
                triggerToast("success", "Success", `Record for ${row.name} duplicated.`);
            }
            else {
                console.log(`Duplicate row clicked for ${row.name}`);
            }
        },
        variant: "default",
    },
    {
        label: "Delete Record",
        icon: "ti-trash",
        variant: "danger",
        onClick: (row) => {
            // Replaced alert with trigger
            const { triggerToast, setShowConfirm } = window.__toastHelpers || {};
            if (triggerToast) {
                triggerToast("error", "Delete Triggered", `Delete action triggered for ${row.name}. Click 'Confirm Delete' below to execute.`);
            }
            if (setShowConfirm) {
                setShowConfirm(true);
            }
        },
    },
];
function AppContent() {
    const { toast, triggerToast } = useToast();
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [passcode, setPasscode] = React.useState("");
    const [isConfirmLoading, setIsConfirmLoading] = React.useState(false); // Confirmation loading spinner state
    // Attach toast helpers globally so module-level rowActions can trigger toasts
    React.useEffect(() => {
        window.__toastHelpers = {
            triggerToast,
            setShowConfirm,
        };
        return () => {
            delete window.__toastHelpers;
        };
    }, [triggerToast]);
    return (_jsxs("div", { className: "app-layout", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "main-area", children: [_jsx(GlobalHeader, {}), _jsxs("main", { children: [_jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dashboard Layout" }), _jsx(DashboardLayout, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Status Cards (KPIs)" }), _jsxs("div", { className: "g ga", style: {
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                            gap: "16px",
                                        }, children: [_jsx(StatusCard, { label: "Active Shipments", value: "1,248", icon: "ti ti-truck", variant: "teal", trend: { value: "12%", type: "up" }, periodText: "vs. last week", sparklineData: [10, 15, 8, 12, 20, 16, 25] }), _jsx(StatusCard, { label: "Delivered Today", value: "354", icon: "ti ti-circle-check", variant: "success", trend: { value: "8%", type: "up" }, periodText: "vs. yesterday", sparklineData: [12, 14, 18, 11, 23, 29, 32] }), _jsx(StatusCard, { label: "At Risk SLA", value: "14 / 10 limit", icon: "ti ti-alert-triangle", variant: "warning", trend: { value: "3%", type: "up" }, periodText: "critical next 2h", polarity: "lower-is-better", sparklineData: [4, 6, 8, 3, 9, 11, 14] }), _jsx(StatusCard, { label: "Failed Deliveries", value: "2", icon: "ti ti-circle-x", variant: "danger", trend: { value: "50%", type: "down" }, periodText: "vs. yesterday", polarity: "lower-is-better", sparklineData: [5, 4, 3, 2, 2, 1, 2] })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Status Badges" }), _jsxs("div", { className: "component-row", style: { display: "flex", gap: "10px", flexWrap: "wrap" }, children: [_jsx(StatusBadge, { status: "Active" }), _jsx(StatusBadge, { status: "Deactivated" }), _jsx(StatusBadge, { status: "Pending" }), _jsx(StatusBadge, { status: "Done" }), _jsx(StatusBadge, { status: "Delivered" }), _jsx(StatusBadge, { status: "In Transit" }), _jsx(StatusBadge, { status: "Failed" }), _jsx(StatusBadge, { status: "Success" }), _jsx(StatusBadge, { status: "Submitted" }), _jsx(StatusBadge, { status: "Picked-Up" }), _jsx(StatusBadge, { status: "Completed" }), _jsx(StatusBadge, { status: "Processing" }), _jsx(StatusBadge, { status: "Preparing" }), _jsx(StatusBadge, { status: "Ready for Pickup" }), _jsx(StatusBadge, { status: "Returning" }), _jsx(StatusBadge, { status: "Not Submitted" }), _jsx(StatusBadge, { status: "Assigned" }), _jsx(StatusBadge, { status: "Out of Delivery" }), _jsx(StatusBadge, { status: "Returned" }), _jsx(StatusBadge, { status: "Cancelled", size: "sm" }), _jsx(StatusBadge, { status: "Partially Paid", size: "sm" }), _jsx(StatusBadge, { status: "Paid", size: "sm" }), _jsx(StatusBadge, { status: "Inflow" }), _jsx(StatusBadge, { status: "Outflow" }), _jsx(StatusBadge, { status: "Overdue" }), _jsx(StatusBadge, { status: "New Payment" }), _jsx(StatusBadge, { status: "30 - 60 Days" }), _jsx(StatusBadge, { status: "60 - 90 Days" }), _jsx(StatusBadge, { status: "90+ Days" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Buttons" }), _jsxs("div", { className: "component-row", style: { display: "flex", gap: "12px", flexWrap: "wrap" }, children: [_jsx(Button, { title: "Save Changes", variant: "primary" }), _jsx(Button, { title: "Add / Create", variant: "primary" }), _jsx(Button, { title: "Edit Record", variant: "secondary" }), _jsx(Button, { title: "Approve Request", variant: "success" }), _jsx(Button, { title: "Activate Account", variant: "success" }), _jsx(Button, { title: "Reject Transaction", variant: "danger" }), _jsx(Button, { title: "Deactivate License", variant: "warning" }), _jsx(Button, { title: "Delete Record", variant: "danger" }), _jsx(Button, { title: "Cancel Action", variant: "secondary" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Dropdown" }), _jsx(Dropdown, { items: dropdownItems })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Search Bar" }), _jsx(SearchBar, { placeholder: "Search waybills, dispatch routes...", onSearch: (val) => console.log("Searching:", val), suggestions: [
                                            { id: "1", label: "SP-77291", category: "Waybill", type: "result" },
                                            { id: "2", label: "Route #8 schedule", category: "Route", type: "trending" },
                                            { id: "3", label: "FirstName LastName profile", category: "User", type: "recent" },
                                        ] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Data Table" }), _jsx(DataTable, { rowKey: "id", data: tableData, columns: tableColumns, actions: rowActions, selectable: true, exportable: true, columnToggle: true, densityToggle: true, bulkActions: [
                                            {
                                                label: "Change Status",
                                                icon: "ti-refresh",
                                                undoable: true,
                                                onClick: (keys) => console.log("Change Status", keys),
                                            },
                                            {
                                                label: "Assign Driver",
                                                icon: "ti-user-check",
                                                undoable: true,
                                                onClick: (keys) => console.log("Assign Driver", keys),
                                            },
                                            {
                                                label: "Export",
                                                icon: "ti-download",
                                                onClick: (keys) => console.log("Export", keys),
                                            },
                                            {
                                                label: "Delete",
                                                icon: "ti-trash",
                                                variant: "danger",
                                                destructive: true,
                                                onClick: (keys) => console.log("Delete", keys),
                                            },
                                        ], filters: [
                                            {
                                                key: "status",
                                                label: "All Statuses",
                                                options: [
                                                    { label: "Active", value: "Active" },
                                                    { label: "Pending", value: "Pending" },
                                                    { label: "Deactivated", value: "Deactivated" },
                                                ],
                                            },
                                            {
                                                key: "role",
                                                label: "All Roles",
                                                options: [
                                                    { label: "Driver", value: "Driver" },
                                                    { label: "Logistics Coordinator", value: "Logistics Coordinator" },
                                                    { label: "Logistics Director", value: "Logistics Director" },
                                                    { label: "Operations Manager", value: "Operations Manager" },
                                                    { label: "Finance Officer", value: "Finance Officer" },
                                                    { label: "Finance Auditor", value: "Finance Auditor" },
                                                    { label: "Warehouse Staff", value: "Warehouse Staff" },
                                                ],
                                            },
                                        ], createButtons: [
                                            { label: "New User", icon: "ti-user", onClick: () => undefined },
                                        ], searchPlaceholder: "Search users..." })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Toastbar" }), _jsxs("div", { className: "tb-btn-row", children: [_jsx("button", { className: "tb-demo-btn success-trigger", onClick: () => toast.success("PHP 5,000 transferred to Juan Dela Cruz.", "Payment Sent Successfully"), children: "Trigger Success Toast" }), _jsx("button", { className: "tb-demo-btn error-trigger", onClick: () => toast.error("Connection timeout. Please review invoice details.", "Transaction Failed", "Retry", () => alert("Retrying invoice settlement...")), children: "Trigger Error Toast (Persistent)" }), _jsx("button", { className: "tb-demo-btn info-trigger", onClick: () => toast.info("Order #DEL-7890 is being prepared for delivery.", "Order Dispatching", "Track Dispatch", () => alert("Redirecting to Shipment Tracking map...")), children: "Trigger Info Toast" }), _jsx("button", { className: "tb-demo-btn warning-trigger", onClick: () => toast.warning("Vehicle Truck TX-492 is currently operating below 15% capacity.", "Low Fuel Level Alert", "Assign Station", () => alert("Assigning nearest refueling point...")), children: "Trigger Warning Toast" })] })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Form Modals & Inputs" }), _jsx(FormModals, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Action Menu & Modals" }), _jsx(ActionButtons, {})] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Notifications (Full Page)" }), _jsx(Notifications, { onViewOrder: (n) => toast.info(`Opening order: ${n.waybillNo || n.title}`, "View Order") })] }), _jsxs("section", { className: "component-section", children: [_jsx("h2", { className: "section-title", children: "Confirm Modal" }), _jsx("div", { className: "component-row", children: _jsx(Button, { title: "Open Destructive Confirm Modal", variant: "danger", onClick: () => setShowConfirm(true) }) }), _jsx(ConfirmModal, { isOpen: showConfirm, title: "Delete Waybill Record", message: "Are you sure you want to permanently delete waybill SP-77291? This will revoke dispatch codes immediately.", variant: "danger", confirmLabel: "Delete Record", requiredPasscode: "DELETE", passcodeValue: passcode, onPasscodeChange: setPasscode, loading: isConfirmLoading, onCancel: () => {
                                            if (!isConfirmLoading) {
                                                setShowConfirm(false);
                                                setPasscode("");
                                            }
                                        }, onConfirm: () => {
                                            setIsConfirmLoading(true);
                                            setTimeout(() => {
                                                setIsConfirmLoading(false);
                                                setShowConfirm(false);
                                                setPasscode("");
                                                toast.error("Waybill SP-77291 has been permanently deleted.", "Deleted");
                                            }, 1200);
                                        } })] })] }), _jsx(GlobalFooter, {})] })] }));
}
function App() {
    return (_jsxs(ToastProvider, { children: [_jsx(AppContent, {}), _jsx(ToastBar, {})] }));
}
export default App;
//# sourceMappingURL=App.js.map