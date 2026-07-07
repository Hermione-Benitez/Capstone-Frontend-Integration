import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import Button from "./Buttons";
import Dropdown from "./Dropdown";
import ConfirmModal from "./ConfirmModal";
import { StatusBadge } from "./StatusBadge";
import { TextField, SelectField } from "./FormModals";
import { useToast } from "./ToastContext";
import "./ActionButtons.css";
const ActionButtons = () => {
    const { toast } = useToast();
    const [activeModal, setActiveModal] = useState(null);
    const [confirmInputText, setConfirmInputText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false); // Async confirmation loading state
    const handleOpenModal = (type) => {
        setActiveModal(type);
        setConfirmInputText("");
    };
    const handleCloseModal = () => {
        if (isDeleting)
            return;
        setActiveModal(null);
    };
    // Low-Friction Tier: Archive triggers a soft undo toast instead of an annoying modal
    const handleArchive = () => {
        toast.success("Record TXN-8472910 archived successfully.", "Success", "Undo", () => toast.success("Archive action undone."));
    };
    const menuItems = [
        {
            key: "view",
            label: "View Details",
            icon: "ti-eye",
            onClick: () => handleOpenModal("view"),
        },
        {
            key: "edit",
            label: "Edit Record",
            icon: "ti-pencil",
            onClick: () => handleOpenModal("edit"),
        },
        {
            key: "archive",
            label: "Archive (Soft-Toast)",
            icon: "ti-archive",
            divider: true,
            onClick: handleArchive,
        },
        {
            key: "delete",
            label: "Delete Record (Standard)",
            icon: "ti-trash",
            divider: true,
            onClick: () => handleOpenModal("delete"),
            variant: "danger",
        },
        {
            key: "delete-finance",
            label: "Delete Payment (High-Friction)",
            icon: "ti-shield",
            onClick: () => handleOpenModal("delete-finance"),
            variant: "danger",
        },
    ];
    const runDelete = (message) => {
        setIsDeleting(true);
        setTimeout(() => {
            setIsDeleting(false);
            handleCloseModal();
            toast.error(message, "Deleted");
        }, 1200);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "ab-trigger-row", children: [_jsx(Dropdown, { items: menuItems, align: "left", placement: "bottom" }), _jsx(Button, { title: "+ New Transaction", variant: "primary", onClick: () => handleOpenModal("create") })] }), _jsxs(ConfirmModal, { isOpen: activeModal === "view", title: "TXN-8472910", message: "", variant: "primary", confirmLabel: "Edit Details", cancelLabel: "Close", icon: "ti-file-text", onCancel: handleCloseModal, onConfirm: () => handleOpenModal("edit"), children: [_jsxs("div", { className: "ab-view-field", children: [_jsx("span", { className: "ab-view-label", children: "Entity Name" }), _jsx("span", { className: "ab-view-value", children: "Acme Corporation" })] }), _jsxs("div", { className: "ab-form-row", children: [_jsxs("div", { className: "ab-view-field", children: [_jsx("span", { className: "ab-view-label", children: "Amount" }), _jsx("span", { className: "ab-view-value", children: "\u20B114,500.00" })] }), _jsxs("div", { className: "ab-view-field", children: [_jsx("span", { className: "ab-view-label", children: "Status" }), _jsx("div", { style: { marginTop: "2px" }, children: _jsx(StatusBadge, { status: "Active" }) })] })] })] }), _jsxs(ConfirmModal, { isOpen: activeModal === "edit", title: "TXN-8472910", message: "", variant: "primary", confirmLabel: "Save Changes", cancelLabel: "Back", icon: "ti-pencil", onCancel: () => handleOpenModal("view"), onConfirm: handleCloseModal, children: [_jsx(TextField, { label: "Entity Name", value: "Acme Corporation", onChange: () => { } }), _jsxs("div", { className: "ab-form-row", children: [_jsx(TextField, { label: "Amount", value: "14500.00", onChange: () => { } }), _jsx(SelectField, { label: "Status", value: "Active", onChange: () => { }, options: [
                                    { value: "Active", label: "Active" },
                                    { value: "Pending", label: "Pending" },
                                    { value: "Failed", label: "Failed" },
                                ] })] })] }), _jsxs(ConfirmModal, { isOpen: activeModal === "create", title: "Create Record", message: "", variant: "primary", confirmLabel: "Create", cancelLabel: "Cancel", icon: "ti-plus", onCancel: handleCloseModal, onConfirm: handleCloseModal, children: [_jsx(TextField, { label: "Entity Name", value: "", onChange: () => { }, placeholder: "Enter entity name..." }), _jsxs("div", { className: "ab-form-row", children: [_jsx(TextField, { label: "Amount", value: "0.00", onChange: () => { } }), _jsx(SelectField, { label: "Currency", value: "PHP", onChange: () => { }, options: [
                                    { value: "PHP", label: "PHP" },
                                    { value: "USD", label: "USD" },
                                    { value: "EUR", label: "EUR" },
                                ] })] })] }), _jsx(ConfirmModal, { isOpen: activeModal === "delete", title: "Delete Record TXN-8472910?", message: "This will permanently remove the shipment record from the database. This action cannot be undone.", variant: "danger", confirmLabel: "Delete Record", cancelLabel: "Cancel", icon: "ti-trash", loading: isDeleting, onCancel: handleCloseModal, onConfirm: () => runDelete("Record TXN-8472910 deleted successfully.") }), _jsx(ConfirmModal, { isOpen: activeModal === "delete-finance", title: "Delete Cleared Payment TXN-8472910?", message: "CRITICAL ALERT: Deleting a cleared financial transaction will affect ledger reconciliation. You must manually reverse the transaction.", variant: "danger", confirmLabel: "Delete Cleared Record", cancelLabel: "Cancel", icon: "ti-shield", requiredPasscode: "TXN-8472910", passcodeValue: confirmInputText, onPasscodeChange: setConfirmInputText, loading: isDeleting, onCancel: handleCloseModal, onConfirm: () => runDelete("Cleared payment TXN-8472910 deleted.") })] }));
};
export default ActionButtons;
//# sourceMappingURL=ActionButtons.js.map