// Así llega cada fila desde PostgreSQL: una por especialidad del monitor
export interface TrainerRow {
  id: number;
  name: string;
  email: string;
  specialty: string | null; // null si el monitor no tiene ninguna
}

// Así lo devuelve nuestra API: un monitor con la lista de sus especialidades
export interface Trainer {
  id: number;
  name: string;
  email: string;
  specialties: string[];
}

// Junta las filas del JOIN (todas del mismo monitor) en un solo monitor
export function toTrainer(rows: TrainerRow[]): Trainer {
  const first = rows[0]; // los datos del monitor se repiten en todas las filas

  return {
    id: first.id,
    name: first.name,
    email: first.email,
    specialties: rows
      .map((row) => row.specialty)
      .filter((specialty): specialty is string => specialty !== null),
  };
}
