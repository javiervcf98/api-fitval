import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Pool } from 'pg';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly pool: Pool) {} // NestJS nos da el Pool

  // GET /api/v1/health: ¿está viva la API? ¿y la base de datos?
  @Get('health')
  async health() {
    const result = await this.pool.query<{ database: string }>(
      'SELECT current_database() AS database',
    );
    return { status: 'ok', database: result.rows[0].database };
  }
}
