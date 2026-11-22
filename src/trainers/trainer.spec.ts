import { toTrainer, TrainerRow } from './trainer';

describe('toTrainer', () => {
  it('junta las filas de un monitor en uno con la lista de especialidades', () => {
    // Las dos filas que devuelve el JOIN para Carla
    const rows: TrainerRow[] = [
      {
        id: 1,
        name: 'Carla Navarro',
        email: 'carla@gym.com',
        specialty: 'Ciclo indoor',
      },
      {
        id: 1,
        name: 'Carla Navarro',
        email: 'carla@gym.com',
        specialty: 'Fuerza',
      },
    ];

    const trainer = toTrainer(rows);

    expect(trainer).toEqual({
      id: 1,
      name: 'Carla Navarro',
      email: 'carla@gym.com',
      specialties: ['Ciclo indoor', 'Fuerza'],
    });
  });
});
