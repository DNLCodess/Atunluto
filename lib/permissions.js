// lib/permissions.js
// ─────────────────────────────────────────────────────────────────────────────
// Role permission constants — plain module, NOT a server action file.
// Import from here instead of from app/actions/adminManagement.js
// ─────────────────────────────────────────────────────────────────────────────

export const CAN_VIEW_MEMBERS = [
  "state_admin",
  "super_user",
  "administrator",
  "registration",
];
export const CAN_EDIT_MEMBERS = ["state_admin", "super_user", "administrator"];
export const CAN_DELETE_MEMBERS = ["state_admin", "super_user"];
export const CAN_REGISTER_MEMBERS = [
  "state_admin",
  "super_user",
  "administrator",
  "registration",
];

export const ROLE_HIERARCHY = {
  state_admin: ["super_user", "administrator", "registration", "manager"],
  super_user: ["administrator", "registration", "manager"],
  administrator: [],
  registration: [],
  manager: [],
};

// Convenience helpers
export const canView = (role) => CAN_VIEW_MEMBERS.includes(role);
export const canEdit = (role) => CAN_EDIT_MEMBERS.includes(role);
export const canDelete = (role) => CAN_DELETE_MEMBERS.includes(role);
export const canRegister = (role) => CAN_REGISTER_MEMBERS.includes(role);
