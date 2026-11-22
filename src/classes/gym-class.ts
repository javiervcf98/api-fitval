// Así llega una clase desde PostgreSQL (con el nombre del monitor, del JOIN)
export interface GymClassRow {
  id: number;
  activity: string;
  room: string;
  starts_at: Date;
  spots: number;
  trainer_name: string;
}

// Así la devuelve nuestra API
export interface GymClass {
  id: number;
  activity: string;
  room: string;
  startsAt: Date;
  spots: number;
  trainerName: string;
}

// Convierte una fila en una clase de la API
export function toGymClass(row: GymClassRow): GymClass {
  return {
    id: row.id,
    activity: row.activity,
    room: row.room,
    startsAt: row.starts_at,
    spots: row.spots,
    trainerName: row.trainer_name,
  };
}

// Así devuelve la API una página de clases (v2)
export interface GymClassPage {
  data: GymClass[];
  total: number; // cuántas clases hay en total (con el filtro)
  page: number;
  limit: number;
  totalPages: number;
}
