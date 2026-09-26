export const ROLES = {
  ADMIN: 'admin',
  DEO: 'deo',
  FACULTY: 'faculty',
  STUDENT: 'student'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Helper groups
export const STAFF_ROLES = [ROLES.ADMIN, ROLES.DEO, ROLES.FACULTY];
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.DEO];
export const ALL_ROLES = [ROLES.ADMIN, ROLES.DEO, ROLES.FACULTY, ROLES.STUDENT];
