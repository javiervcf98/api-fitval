import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ClassesService } from './classes.service';

// Una fila de clase como la devuelve el JOIN. La usarás en varios tests
const spinningRow = {
  id: 1,
  activity: 'Spinning',
  room: 'Sala 1',
  starts_at: new Date('2026-11-02T09:00:00Z'),
  spots: 12,
  trainer_name: 'Carla Navarro',
};

describe('ClassesService', () => {
  // Un Pool FALSO: tiene un método query, pero no habla con PostgreSQL
  const fakePool = { query: jest.fn() };
  const service = new ClassesService(fakePool as unknown as Pool);

  beforeEach(() => {
    fakePool.query.mockReset(); // antes de cada test, el falso empieza de cero
  });

  // Ejemplo resuelto
  it('findOne lanza un 404 si no hay ninguna fila', async () => {
    fakePool.query.mockResolvedValue({ rows: [] }); // "la base de datos no encuentra nada"

    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  // Ejercicio 6.3
  it('findOne devuelve la clase convertida si encuentra una fila', async () => {
    fakePool.query.mockResolvedValue({ rows: [spinningRow] });

    const gymClass = await service.findOne(1);

    expect(gymClass.trainerName).toBe('Carla Navarro');
    expect(gymClass.startsAt).toEqual(new Date('2026-11-02T09:00:00Z'));
  });

  // Ejercicio 6.4
  it('create con un monitor que no existe lanza un 400 y no hace el INSERT', async () => {
    fakePool.query.mockResolvedValue({ rows: [] }); // el SELECT de trainers no encuentra nada

    await expect(
      service.create({
        activity: 'Fuerza',
        room: 'Sala 3',
        startsAt: '2026-11-10T18:00:00Z',
        spots: 15,
        trainerId: 99,
      }),
    ).rejects.toThrow(BadRequestException);

    // Solo se hizo 1 consulta (el SELECT): nunca llegó al INSERT
    expect(fakePool.query).toHaveBeenCalledTimes(1);
  });

  // Ejercicio 6.5
  it('remove lanza un 409 si la clase tiene reservas y no llega al DELETE', async () => {
    fakePool.query
      .mockResolvedValueOnce({ rows: [spinningRow] }) // 1.ª: findOne encuentra la clase
      .mockResolvedValueOnce({ rows: [{ total: 3 }] }); // 2.ª: el COUNT dice 3 reservas

    await expect(service.remove(1)).rejects.toThrow(ConflictException);

    // Solo 2 consultas (findOne y COUNT): nunca llegó al DELETE
    expect(fakePool.query).toHaveBeenCalledTimes(2);
  });

  // Ejercicio 6.6
  it('remove de una clase sin reservas la devuelve y hace el DELETE', async () => {
    fakePool.query
      .mockResolvedValueOnce({ rows: [spinningRow] }) // 1.ª: findOne
      .mockResolvedValueOnce({ rows: [{ total: 0 }] }) // 2.ª: COUNT, sin reservas
      .mockResolvedValueOnce({ rows: [] }); // 3.ª: el DELETE

    const gymClass = await service.remove(1);

    expect(gymClass.id).toBe(1);
    expect(fakePool.query).toHaveBeenCalledTimes(3);
    // Para nota: la 3.ª consulta es el DELETE de la clase 1
    expect(fakePool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('DELETE'),
      [1],
    );
  });

  // Ejercicio 8.3
  it('findPage devuelve el total y calcula totalPages', async () => {
    fakePool.query
      .mockResolvedValueOnce({ rows: [spinningRow] }) // 1.ª: las clases de la página
      .mockResolvedValueOnce({ rows: [{ total: 7 }] }); // 2.ª: el COUNT

    const page = await service.findPage({
      page: 1,
      limit: 3,
      sort: 'startsAt',
      order: 'asc',
    });

    expect(page.data).toHaveLength(1);
    expect(page.total).toBe(7);
    expect(page.totalPages).toBe(3); // 7 clases de 3 en 3 → 3 páginas
  });
});
