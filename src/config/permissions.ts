export const PERMISSIONS = {
  ORGANIZATION_EDIT: "organization:edit",
  ORGANIZATION_MANAGE_MEMBERS: "organization:manage_members",

  BOARDS_CREATE: "boards:create",
  BOARDS_READ: "boards:read",
  BOARDS_UPDATE: "boards:update",
  BOARDS_DELETE: "boards:delete",

  LISTS_CREATE: "lists:create",
  LISTS_READ: "lists:read",
  LISTS_UPDATE: "lists:update",
  LISTS_DELETE: "lists:delete",

  FINANCE_CREATE: "finance:create",
  FINANCE_READ: "finance:read",
  FINANCE_UPDATE: "finance:update",
  FINANCE_DELETE: "finance:delete",

  EMBED_CREATE: "embed:create",
  EMBED_READ: "embed:read",
  EMBED_UPDATE: "embed:update",
  EMBED_DELETE: "embed:delete",

  CONTRACTS_CREATE: "contracts:create",
  CONTRACTS_READ: "contracts:read",
  CONTRACTS_UPDATE: "contracts:update",
  CONTRACTS_DELETE: "contracts:delete",

  CALENDAR_CREATE: "calendar:create",
  CALENDAR_READ: "calendar:read",
  CALENDAR_UPDATE: "calendar:update",
  CALENDAR_DELETE: "calendar:delete",

  DISPATCH_SEND: "dispatch:send",
  DISPATCH_READ: "dispatch:read",
  DISPATCH_DELETE: "dispatch:delete",

  WHATSAPP_CREATE: "whatsapp:create",
  WHATSAPP_READ: "whatsapp:read",
  WHATSAPP_UPDATE: "whatsapp:update",
  WHATSAPP_DELETE: "whatsapp:delete",
};

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
