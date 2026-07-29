export const SYSTEMS_LIST = [
  { key: "dms",   name: "DMS",   icon: "ti ti-truck",          accentColor: "#00A99D" },
  { key: "stars", name: "STARS", icon: "ti ti-clipboard-list",  accentColor: "#0284C7" },
  { key: "foms",  name: "FOMS",  icon: "ti ti-report-money",    accentColor: "#4F46E5" },
];

export const ADMIN_PROFILE = {
  name: "FirstName LastName",
  role: "System Administrator",
  avatarInitials: "FL",
};

export interface Person {
  id: number;
  name: string;
  role: string;
  status: string;
}

export const tableData: Person[] = [
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

export const tableColumns = [
  { key: "id",     label: "ID",     sortable: true },
  { key: "name",   label: "Name",   sortable: true },
  { key: "role",   label: "Role",   sortable: true },
  { key: "status", label: "Status", sortable: true },
];

export const dropdownItems: Array<{ key: string; label: string; variant?: "default" | "danger" }> = [
  { key: "edit",      label: "Edit",      variant: "default" },
  { key: "duplicate", label: "Duplicate", variant: "default" },
  { key: "delete",    label: "Delete",    variant: "danger"  },
];
