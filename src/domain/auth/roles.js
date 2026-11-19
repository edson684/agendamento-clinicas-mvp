// RBAC: papéis e permissões (menor privilégio). Administrador NÃO recebe 'clinical:access'.
export const Roles = Object.freeze({
  PACIENTE: 'paciente', RECEPCIONISTA: 'recepcionista',
  PROFISSIONAL: 'profissional', ADMINISTRADOR: 'administrador',
});
export const ROLE_PERMISSIONS = Object.freeze({
  [Roles.PACIENTE]: ['appointment:own', 'professional:list', 'notification:own'],
  [Roles.RECEPCIONISTA]: ['patient:manage', 'patient:read', 'professional:manage', 'professional:list',
    'appointment:manage', 'notification:manage'],
  [Roles.PROFISSIONAL]: ['patient:read', 'professional:list', 'appointment:agenda', 'clinical:access'],
  [Roles.ADMINISTRADOR]: ['user:manage', 'professional:manage', 'professional:list',
    'audit:read', 'notification:manage'],
});
export const hasPermission = (role, permission) => (ROLE_PERMISSIONS[role] ?? []).includes(permission);
