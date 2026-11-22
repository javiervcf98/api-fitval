import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { toTrainer, Trainer, TrainerRow } from './trainer';

// ¿Es el error de PostgreSQL de "valor repetido" (UNIQUE)? Su código es 23505
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

@Injectable()
export class TrainersService {
  constructor(private readonly pool: Pool) {}

  // GET /api/v1/trainers/:id
  async findOne(id: number): Promise<Trainer> {
    const result = await this.pool.query<TrainerRow>(
      `SELECT t.id, t.name, t.email, s.name AS specialty
       FROM trainers t
       LEFT JOIN trainer_specialties ts ON ts.trainer_id = t.id
       LEFT JOIN specialties s ON s.id = ts.specialty_id
       WHERE t.id = $1
       ORDER BY s.id`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('No existe ningún monitor con ese id'); // → 404
    }

    return toTrainer(result.rows);
  }

  // POST /api/v1/trainers: el monitor y sus especialidades, todo o nada
  async create(dto: CreateTrainerDto): Promise<Trainer> {
    // Una conexión concreta del Pool: la transacción va entera por ella
    const client = await this.pool.connect();
    let trainerId = 0;

    try {
      // 1. Empieza la transacción
      await client.query('BEGIN');

      // 2. El monitor
      const result = await client.query<{ id: number }>(
        `INSERT INTO trainers (dni, name, email)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [dto.dni, dto.name, dto.email],
      );
      trainerId = result.rows[0].id;

      // 3. Sus especialidades, una a una
      for (const specialtyId of dto.specialtyIds) {
        const specialty = await client.query(
          'SELECT id FROM specialties WHERE id = $1',
          [specialtyId],
        );
        if (specialty.rows.length === 0) {
          // El id llega en el body → 400. Y el catch deshará el INSERT del monitor
          throw new BadRequestException(
            `No existe la especialidad ${specialtyId}`,
          );
        }

        await client.query(
          'INSERT INTO trainer_specialties (trainer_id, specialty_id) VALUES ($1, $2)',
          [trainerId, specialtyId],
        );
      }

      // 4. Todo ha ido bien: guardamos todo de golpe
      await client.query('COMMIT');
    } catch (error) {
      // Algo ha fallado: deshacemos TODO lo de esta transacción
      await client.query('ROLLBACK');

      if (isUniqueViolation(error)) {
        throw new ConflictException('Ya existe un monitor con ese DNI o email'); // → 409
      }
      throw error; // cualquier otro error (también el 400 de arriba), tal cual
    } finally {
      // Pase lo que pase, devolvemos la conexión al Pool
      client.release();
    }

    // 5. El monitor completo, con sus especialidades
    return this.findOne(trainerId);
  }
}
