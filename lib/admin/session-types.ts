export type AdminRole = 'admin' | 'member';

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: AdminRole;
  active: boolean;
};

export type ProjectStatus = { key: string; label: string; short: string; color: string };

export type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  color: string;
  client: string;
  taskCount: number;
};

export const roleLabels: Record<AdminRole, string> = { admin: 'Administrador', member: 'Miembro' };
