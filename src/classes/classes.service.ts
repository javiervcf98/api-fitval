import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CreateClassDto } from './dto/create-class.dto';
import { ListClassesQueryDto } from './dto/list-classes-query.dto';
import { GymClass, GymClassPage, GymClassRow, toGymClass } from './gym-class';

// La parte común de todas las consultas de clases: con el nombre del monitor
const SELECT_CLASSES = `
  SELECT c.id, c.activity, c.room, c.starts_at, c.spots, t.name AS trainer_name
  FROM classes c
  JOIN trainers t ON t.id = c.trainer_id`;

// El campo de la API → la columna de la tabla
const SORT_COLUMNS: Record<ListClassesQueryDto['sort'], string> = {
  startsAt: 'c.starts_at',
  activity: 'c.activity',
  spots: 'c.spots',
};

@Injectable()
export class ClassesService {
  constructor(private readonly pool: Pool) {}

  // GET /api/v1/classes y GET /api/v1/classes?activity=yoga
  async findAll(activity?: string): Promise<GymClass[]> {
    if (activity) {
      const result = await this.pool.query<GymClassRow>(
        `${SELECT_CLASSES} WHERE c.activity ILIKE '%' || $1 || '%' ORDER BY c.starts_at`,
        [activity],
      );
      return result.rows.map(toGymClass);
    }

    const result = await this.pool.query<GymClassRow>(
      `${SELECT_CLASSES} ORDER BY c.starts_at`,
    );
    return result.rows.map(toGymClass);
  }

  // GET /api/v2/classes: una página de clases
  async findPage(query: ListClassesQueryDto): Promise<GymClassPage> {
    const { page, limit, sort, order, activity } = query;

    // El filtro es opcional: si llega, añadimos el WHERE y su $1
    const where = activity ? `WHERE c.activity ILIKE '%' || $1 || '%'` : '';
    const params: (string | number)[] = activity ? [activity] : [];

    const direction = order === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit; // cuántas clases saltarse

    // 1. Las clases de esta página
    const result = await this.pool.query<GymClassRow>(
      `${SELECT_CLASSES} ${where}
       ORDER BY ${SORT_COLUMNS[sort]} ${direction}, c.id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    // 2. Cuántas hay en total (con el mismo filtro)
    const count = await this.pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM classes c ${where}`,
      params,
    );
    const total = count.rows[0].total;

    return {
      data: result.rows.map(toGymClass),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET /api/v1/classes/:id
  async findOne(id: number): Promise<GymClass> {
    const result = await this.pool.query<GymClassRow>(
      `${SELECT_CLASSES} WHERE c.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('No existe ninguna clase con ese id'); // → 404
    }

    return toGymClass(result.rows[0]);
  }

  // POST /api/v1/classes
  async create(dto: CreateClassDto): Promise<GymClass> {
    // 1. ¿Existe el monitor?
    const trainer = await this.pool.query(
      'SELECT id FROM trainers WHERE id = $1',
      [dto.trainerId],
    );
    if (trainer.rows.length === 0) {
      throw new BadRequestException(
        'No existe ningún monitor con ese trainerId',
      ); // → 400
    }

    // 2. Guardamos la clase. RETURNING nos da su id nuevo
    const result = await this.pool.query<{ id: number }>(
      `INSERT INTO classes (activity, room, starts_at, spots, trainer_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [dto.activity, dto.room, dto.startsAt, dto.spots, dto.trainerId],
    );

    // 3. Devolvemos la clase completa, con el nombre del monitor
    return this.findOne(result.rows[0].id);
  }

  // DELETE /api/v1/classes/:id
  async remove(id: number): Promise<GymClass> {
    // 1. ¿Existe? findOne ya lanza el 404 si no
    const gymClass = await this.findOne(id);

    // 2. ¿Tiene reservas? Si las tiene, no se borra
    const bookings = await this.pool.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM bookings WHERE class_id = $1',
      [id],
    );
    if (bookings.rows[0].total > 0) {
      throw new ConflictException(
        'No se puede borrar: la clase tiene reservas',
      ); // → 409
    }

    // 3. La borramos y devolvemos la que había
    await this.pool.query('DELETE FROM classes WHERE id = $1', [id]);
    return gymClass;
  }
}
