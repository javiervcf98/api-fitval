export type Role = 'member' | 'staff';

// Así llega un usuario desde PostgreSQL (con el hash)
export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
}

// Así lo devuelve nuestra API: sin el hash, nunca
export interface User {
  id: number;
  email: string;
  role: Role;
}

// Convierte una fila en un usuario de la API (quitando el hash)
export function toUser(row: UserRow): User {
  return { id: row.id, email: row.email, role: row.role };
}
