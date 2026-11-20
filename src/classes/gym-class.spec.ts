import { GymClassRow, toGymClass } from './gym-class';

// Una fila como las que devuelve PostgreSQL. La usan los dos tests
const row: GymClassRow = {
  id: 1,
  activity: 'Spinning',
  room: 'Sala 1',
  starts_at: new Date('2026-11-02T09:00:00Z'),
  spots: 12,
  trainer_name: 'Carla Navarro',
};

describe('toGymClass', () => {
  it('convierte una fila de la base de datos en una clase de la API', () => {
    const gymClass = toGymClass(row);

    expect(gymClass).toEqual({
      id: 1,
      activity: 'Spinning',
      room: 'Sala 1',
      startsAt: new Date('2026-11-02T09:00:00Z'),
      spots: 12,
      trainerName: 'Carla Navarro',
    });
  });

  it('no deja las columnas de la base de datos en la clase', () => {
    const gymClass = toGymClass(row);

    expect(gymClass).not.toHaveProperty('starts_at');
    expect(gymClass).not.toHaveProperty('trainer_name');
  });
});
