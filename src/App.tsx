import React from "react";
import {
  GlobalHeader,
  GlobalFooter,
  Button,
  Dropdown,
  DataTable,
  Sidebar,
  StatusCard,
  StatusBadge,
  DashboardLayout,
  FormModals,
  SearchBar,
  ConfirmModal,
  Notifications,
  ToastProvider,
  useToast,
} from "./components";
import ToastBar from "./components/ToastBar";
import ActionButtons from "./components/ActionButtons";
import SystemSelectorPage, { type SystemKey } from "./components/SystemSelectorPage";

/* ── System Switcher Registry (shared across App) ──────────────── */
const SYSTEMS_LIST = [
  { key: "dms",   name: "DMS",   icon: "ti ti-truck",          accentColor: "#00A99D" },
  { key: "stars", name: "STARS", icon: "ti ti-clipboard-list",  accentColor: "#0284C7" },
  { key: "foms",  name: "FOMS",  icon: "ti ti-report-money",    accentColor: "#4F46E5" },
];

const ADMIN_PROFILE = {
  name: "FirstName LastName",
  role: "System Administrator",
  avatarInitials: "FL",
};

interface Person {
  id: number;
  name: string;
  role: string;
  status: string;
}

const tableData: Person[] = [
  { id: 1,  name: "Juan Dela Cruz",        role: "Driver",                  status: "Active"      },
  { id: 2,  name: "Maria Santos",          role: "Logistics Coordinator",   status: "Active"      },
  { id: 3,  name: "Carlos Reyes",          role: "Driver",                  status: "Active"      },
  { id: 4,  name: "Angelica Tan",          role: "Finance Officer",         status: "Active"      },
  { id: 5,  name: "Roberto Mendoza",       role: "Warehouse Staff",         status: "Pending"     },
  { id: 6,  name: "Sofia Martinez",        role: "Operations Manager",      status: "Active"      },
  { id: 7,  name: "Diego Garcia",          role: "Driver",                  status: "Deactivated" },
  { id: 8,  name: "FirstName LastName",    role: "Logistics Director",      status: "Active"      },
  { id: 9,  name: "Paolo Villanueva",      role: "Driver",                  status: "Active"      },
  { id: 10, name: "Andrea Cruz",           role: "Finance Auditor",         status: "Active"      },
  { id: 11, name: "Miguel Torres",         role: "Warehouse Staff",         status: "Active"      },
  { id: 12, name: "Patricia Lim",          role: "Operations Manager",      status: "Active"      },
  { id: 13, name: "Enrique Ramos",         role: "Driver",                  status: "Pending"     },
  { id: 14, name: "Clarissa Ong",          role: "Logistics Coordinator",   status: "Active"      },
  { id: 15, name: "Fernando Aquino",       role: "Driver",                  status: "Active"      },
  { id: 16, name: "Bianca Navarro",        role: "Finance Officer",         status: "Active"      },
  { id: 17, name: "Ricardo Flores",        role: "Driver",                  status: "Deactivated" },
  { id: 18, name: "Gabriela Pascual",      role: "Warehouse Staff",         status: "Active"      },
  { id: 19, name: "Vincent Castillo",      role: "Driver",                  status: "Active"      },
  { id: 20, name: "Samantha Dizon",        role: "Logistics Coordinator",   status: "Active"      },
  { id: 21, name: "Antonio Bautista",      role: "Driver",                  status: "Active"      },
  { id: 22, name: "Jasmine Perez",         role: "Finance Officer",         status: "Pending"     },
  { id: 23, name: "Marco Salazar",         role: "Operations Manager",      status: "Active"      },
  { id: 24, name: "Nicole Reyes",          role: "Warehouse Staff",         status: "Active"      },
  { id: 25, name: "Daniel Soriano",        role: "Driver",                  status: "Active"      },
  { id: 26, name: "Camille Velasco",       role: "Logistics Coordinator",   status: "Active"      },
  { id: 27, name: "Rafael Santiago",       role: "Driver",                  status: "Deactivated" },
  { id: 28, name: "Monica Aguilar",        role: "Finance Auditor",         status: "Active"      },
  { id: 29, name: "Jose Mercado",          role: "Driver",                  status: "Pending"     },
  { id: 30, name: "Katrina David",         role: "Operations Manager",      status: "Active"      },
];

const tableColumns = [
  { key: "id",     label: "ID",     sortable: true },
  { key: "name",   label: "Name",   sortable: true },
  { key: "role",   label: "Role",   sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const dropdownItems: Array<{ key: string; label: string; variant?: "default" | "danger" }> = [
  { key: "edit",      label: "Edit",      variant: "default" },
  { key: "duplicate", label: "Duplicate", variant: "default" },
  { key: "delete",    label: "Delete",    variant: "danger"  },
];

const rowActions: Array<{
  label: string;
  icon: string;
  onClick: (row: Person) => void;
  variant?: "default" | "danger";
}> = [
  {
    label: "Edit Details",
    icon: "ti-pencil",
    variant: "default",
    onClick: (row) => {
      const { triggerToast } = (window as any).__toastHelpers || {};
      if (triggerToast) triggerToast("info", "Edit Mode", `Opening edit portal for ${row.name}...`);
    },
  },
  {
    label: "Duplicate Row",
    icon: "ti-copy",
    variant: "default",
    onClick: (row) => {
      const { triggerToast } = (window as any).__toastHelpers || {};
      if (triggerToast) triggerToast("success", "Success", `Record for ${row.name} duplicated.`);
    },
  },
  {
    label: "Delete Record",
    icon: "ti-trash",
    variant: "danger",
    onClick: (row) => {
      const { triggerToast, setShowConfirm } = (window as any).__toastHelpers || {};
      if (triggerToast) triggerToast("error", "Delete Triggered", `Delete triggered for ${row.name}.`);
      if (setShowConfirm) setShowConfirm(true);
    },
  },
];

/* ── AppContent ─────────────────────────────────────────────────── */

interface AppContentProps {
  currentSystem: string;
  onSystemChange: (key: string) => void;
}

function AppContent({ currentSystem, onSystemChange }: AppContentProps) {
  const { toast, triggerToast } = useToast();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [passcode, setPasscode] = React.useState("");
  const [isConfirmLoading, setIsConfirmLoading] = React.useState(false);

  /** Which switcher variant the FE team is previewing */
  const [switcherVariant, setSwitcherVariant] = React.useState<"A" | "B">("A");

  React.useEffect(() => {
    (window as any).__toastHelpers = { triggerToast, setShowConfirm };
    return () => { delete (window as any).__toastHelpers; };
  }, [triggerToast]);

  const currentSysLabel =
    SYSTEMS_LIST.find((s) => s.key === currentSystem)?.name ?? currentSystem.toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        {/* TopBar with active system switcher variant */}
        <GlobalHeader
          title="Dashboard"
          profile={ADMIN_PROFILE}
          systemSwitcher={{
            variant: switcherVariant,
            currentSystem,
            systems: SYSTEMS_LIST,
            onSwitch: onSystemChange,
          }}
        />

        <main>

          {/* ── System Switcher Variant Showcase ─────────────────── */}
          <section className="component-section">
            <h2 className="section-title">
              System Switcher — TopBar Variants
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginLeft: 12,
                background: "rgba(0,169,157,0.1)",
                color: "#00A99D",
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                fontFamily: "var(--fb)",
                verticalAlign: "middle",
              }}>
                <i className="ti ti-apps" />
                {currentSysLabel} Active
              </span>
            </h2>

            <p style={{ color: "var(--tt)", fontSize: 14, marginBottom: 20, lineHeight: 1.65, maxWidth: 680 }}>
              Two topbar system-switcher variants are provided for the FE team to choose from.
              Use the toggle below to preview each variant live in the TopBar above.
            </p>

            {/* Variant toggle buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {(["A", "B"] as const).map((v) => (
                <button
                  key={v}
                  id={`switcher-variant-${v}`}
                  onClick={() => setSwitcherVariant(v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: `1.5px solid ${switcherVariant === v ? "var(--teal,#00A99D)" : "var(--border,#E2E8F0)"}`,
                    background: switcherVariant === v ? "rgba(0,169,157,0.08)" : "#fff",
                    color: switcherVariant === v ? "var(--teal,#00A99D)" : "var(--ts,#374151)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--fb)",
                    transition: "all 180ms ease",
                  }}
                >
                  <i className={v === "A" ? "ti ti-layout-navbar" : "ti ti-user-circle"} />
                  Variant {v}
                  <span style={{ opacity: 0.55, fontWeight: 400, fontSize: 12 }}>
                    {v === "A" ? "— Inline Chip" : "— Profile Dropdown"}
                  </span>
                </button>
              ))}

              {/* Back to selector */}
              <button
                id="btn-back-to-selector"
                onClick={() => onSystemChange("__selector__")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border,#E2E8F0)",
                  background: "#fff",
                  color: "var(--tt,#6B7280)",
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--fb)",
                  marginLeft: "auto",
                }}
              >
                <i className="ti ti-arrow-left" />
                Back to System Selector
              </button>
            </div>

            {/* Hint per variant */}
            <div style={{
              background: "var(--s1,#F7F9FF)",
              border: "1px solid var(--border,#E2E8F0)",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--ts,#374151)",
              lineHeight: 1.65,
              maxWidth: 640,
            }}>
              {switcherVariant === "A" ? (
                <>
                  <strong style={{ color: "var(--teal,#00A99D)" }}>Variant A — Inline Chip:</strong>{" "}
                  A dark pill chip appears in the TopBar next to the page title showing the active system (
                  <strong>{currentSysLabel}</strong>). Click it to open the system switcher dropdown.
                </>
              ) : (
                <>
                  <strong style={{ color: "var(--teal,#00A99D)" }}>Variant B — Profile Dropdown:</strong>{" "}
                  Click the <strong>profile avatar</strong> on the top-right of the TopBar. The dropdown shows a
                  "Switch System" section at the top — select any system to jump to it.
                </>
              )}
            </div>
          </section>

          {/* ── Dashboard Layout ──────────────────────────────────── */}
          <section className="component-section">
            <h2 className="section-title">Dashboard Layout</h2>
            <DashboardLayout />
          </section>

          <section className="component-section">
            <h2 className="section-title">Status Cards (KPIs)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <StatusCard label="Active Shipments" value="1,248" icon="ti ti-truck"         variant="teal"    trend={{ value: "12%", type: "up" }}   periodText="vs. last week"   sparklineData={[10,15,8,12,20,16,25]} />
              <StatusCard label="Delivered Today"  value="354"   icon="ti ti-circle-check"  variant="success" trend={{ value: "8%",  type: "up" }}   periodText="vs. yesterday"   sparklineData={[12,14,18,11,23,29,32]} />
              <StatusCard label="At Risk SLA"      value="14 / 10 limit" icon="ti ti-alert-triangle" variant="warning" trend={{ value: "3%", type: "up" }} periodText="critical next 2h" polarity="lower-is-better" sparklineData={[4,6,8,3,9,11,14]} />
              <StatusCard label="Failed Deliveries" value="2"   icon="ti ti-circle-x"      variant="danger"  trend={{ value: "50%", type: "down" }} periodText="vs. yesterday"   polarity="lower-is-better" sparklineData={[5,4,3,2,2,1,2]} />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Status Badges</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <StatusBadge status="Active" /><StatusBadge status="Deactivated" /><StatusBadge status="Pending" />
              <StatusBadge status="Done" /><StatusBadge status="Delivered" /><StatusBadge status="In Transit" />
              <StatusBadge status="Failed" /><StatusBadge status="Success" /><StatusBadge status="Submitted" />
              <StatusBadge status="Picked-Up" /><StatusBadge status="Completed" /><StatusBadge status="Processing" />
              <StatusBadge status="Preparing" /><StatusBadge status="Ready for Pickup" /><StatusBadge status="Returning" />
              <StatusBadge status="Not Submitted" /><StatusBadge status="Assigned" /><StatusBadge status="Out of Delivery" />
              <StatusBadge status="Returned" /><StatusBadge status="Cancelled" size="sm" /><StatusBadge status="Partially Paid" size="sm" />
              <StatusBadge status="Paid" size="sm" /><StatusBadge status="Inflow" /><StatusBadge status="Outflow" />
              <StatusBadge status="Overdue" /><StatusBadge status="New Payment" /><StatusBadge status="30 - 60 Days" />
              <StatusBadge status="60 - 90 Days" /><StatusBadge status="90+ Days" />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Buttons</h2>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button title="Save Changes"        variant="primary"   />
              <Button title="Add / Create"        variant="primary"   />
              <Button title="Edit Record"         variant="secondary" />
              <Button title="Approve Request"     variant="success"   />
              <Button title="Activate Account"    variant="success"   />
              <Button title="Reject Transaction"  variant="danger"    />
              <Button title="Deactivate License"  variant="warning"   />
              <Button title="Delete Record"       variant="danger"    />
              <Button title="Cancel Action"       variant="secondary" />
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Dropdown</h2>
            <Dropdown items={dropdownItems} />
          </section>

          <section className="component-section">
            <h2 className="section-title">Search Bar</h2>
            <SearchBar
              placeholder="Search waybills, dispatch routes..."
              onSearch={(val) => console.log("Searching:", val)}
              suggestions={[
                { id: "1", label: "SP-77291",               category: "Waybill", type: "result"   },
                { id: "2", label: "Route #8 schedule",       category: "Route",   type: "trending" },
                { id: "3", label: "FirstName LastName profile", category: "User", type: "recent"   },
              ]}
            />
          </section>

          <section className="component-section">
            <h2 className="section-title">Data Table</h2>
            <DataTable
              rowKey="id"
              data={tableData}
              columns={tableColumns}
              actions={rowActions}
              selectable
              exportable
              columnToggle
              densityToggle
              bulkActions={[
                { label: "Change Status", icon: "ti-refresh",    undoable: true, onClick: (k) => console.log("Change Status", k) },
                { label: "Assign Driver", icon: "ti-user-check", undoable: true, onClick: (k) => console.log("Assign Driver", k) },
                { label: "Export",        icon: "ti-download",                   onClick: (k) => console.log("Export", k) },
                { label: "Delete",        icon: "ti-trash", variant: "danger", destructive: true, onClick: (k) => console.log("Delete", k) },
              ]}
              filters={[
                {
                  key: "status", label: "All Statuses",
                  options: [
                    { label: "Active",      value: "Active"      },
                    { label: "Pending",     value: "Pending"     },
                    { label: "Deactivated", value: "Deactivated" },
                  ],
                },
                {
                  key: "role", label: "All Roles",
                  options: [
                    { label: "Driver",                 value: "Driver"                 },
                    { label: "Logistics Coordinator",  value: "Logistics Coordinator"  },
                    { label: "Logistics Director",     value: "Logistics Director"     },
                    { label: "Operations Manager",     value: "Operations Manager"     },
                    { label: "Finance Officer",        value: "Finance Officer"        },
                    { label: "Finance Auditor",        value: "Finance Auditor"        },
                    { label: "Warehouse Staff",        value: "Warehouse Staff"        },
                  ],
                },
              ]}
              createButtons={[{ label: "New User", icon: "ti-user", onClick: () => undefined }]}
              searchPlaceholder="Search users..."
            />
          </section>

          <section className="component-section">
            <h2 className="section-title">Toastbar</h2>
            <div className="tb-btn-row">
              <button className="tb-demo-btn success-trigger" onClick={() => toast.success("PHP 5,000 transferred to Juan Dela Cruz.", "Payment Sent Successfully")}>Trigger Success Toast</button>
              <button className="tb-demo-btn error-trigger"   onClick={() => toast.error("Connection timeout. Please review invoice details.", "Transaction Failed", "Retry", () => alert("Retrying..."))}>Trigger Error Toast (Persistent)</button>
              <button className="tb-demo-btn info-trigger"    onClick={() => toast.info("Order #DEL-7890 is being prepared for delivery.", "Order Dispatching", "Track Dispatch", () => alert("Redirecting..."))}>Trigger Info Toast</button>
              <button className="tb-demo-btn warning-trigger" onClick={() => toast.warning("Vehicle Truck TX-492 is operating below 15% capacity.", "Low Fuel Level Alert", "Assign Station", () => alert("Assigning..."))}>Trigger Warning Toast</button>
            </div>
          </section>

          <section className="component-section">
            <h2 className="section-title">Form Modals &amp; Inputs</h2>
            <FormModals />
          </section>

          <section className="component-section">
            <h2 className="section-title">Action Menu &amp; Modals</h2>
            <ActionButtons />
          </section>

          <section className="component-section">
            <h2 className="section-title">Notifications (Full Page)</h2>
            <Notifications onViewOrder={(n) => toast.info(`Opening order: ${n.waybillNo || n.title}`, "View Order")} />
          </section>

          <section className="component-section">
            <h2 className="section-title">Confirm Modal</h2>
            <div className="component-row">
              <Button title="Open Destructive Confirm Modal" variant="danger" onClick={() => setShowConfirm(true)} />
            </div>
            <ConfirmModal
              isOpen={showConfirm}
              title="Delete Waybill Record"
              message="Are you sure you want to permanently delete waybill SP-77291? This will revoke dispatch codes immediately."
              variant="danger"
              confirmLabel="Delete Record"
              requiredPasscode="DELETE"
              passcodeValue={passcode}
              onPasscodeChange={setPasscode}
              loading={isConfirmLoading}
              onCancel={() => { if (!isConfirmLoading) { setShowConfirm(false); setPasscode(""); } }}
              onConfirm={() => {
                setIsConfirmLoading(true);
                setTimeout(() => {
                  setIsConfirmLoading(false);
                  setShowConfirm(false);
                  setPasscode("");
                  toast.error("Waybill SP-77291 has been permanently deleted.", "Deleted");
                }, 1200);
              }}
            />
          </section>

        </main>

        <GlobalFooter />
      </div>
    </div>
  );
}

/* ── Root App ───────────────────────────────────────────────────── */

function App() {
  const [currentSystem, setCurrentSystem] = React.useState<string | null>(null);

  const handleSystemChange = (key: string) => {
    setCurrentSystem(key === "__selector__" ? null : key);
  };

  return (
    <ToastProvider>
      {currentSystem === null ? (
        <SystemSelectorPage
          profile={ADMIN_PROFILE}
          onSelect={(key: SystemKey) => setCurrentSystem(key)}
        />
      ) : (
        <AppContent
          currentSystem={currentSystem}
          onSystemChange={handleSystemChange}
        />
      )}
      <ToastBar />
    </ToastProvider>
  );
}

export default App;
