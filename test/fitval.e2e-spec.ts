import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';

// El body de una clase válida, como en el Ejercicio 4.1
const newClass = {
  activity: 'Fuerza',
  room: 'Sala 3',
  startsAt: '2026-11-10T18:00:00Z',
  spots: 15,
  trainerId: 4,
};

describe('API de FitVal', () => {
  let app: INestApplication<App>;
  let memberToken: string;

  // Antes de todos los tests: arrancamos la API entera y creamos un socio
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app); // la misma configuración que main.ts
    await app.init();

    // Un correo distinto en cada ejecución, para que el registro no dé 409
    const email = `test-${Date.now()}@fitval.com`;
    const password = '12345678';

    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password });
    expect(register.status).toBe(201); // si el correo se repitiera, fallaría aquí

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    memberToken = (login.body as { accessToken: string }).accessToken;
  });

  // Después de todos: cerramos PostgreSQL y la API (si no, Jest no termina)
  afterAll(async () => {
    await app.get(Pool).end();
    await app.close();
  });

  it('GET /api/v1/health responde 200', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'fitval' });
  });

  // Ejercicio 7.1
  it('GET /api/v1/classes responde 200 con un array', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/classes');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/v1/classes/abc responde 400', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/classes/abc',
    );

    expect(response.status).toBe(400);
  });

  it('GET /api/v1/classes/999999 responde 404', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/classes/999999',
    );

    expect(response.status).toBe(404);
  });

  it('POST /api/v1/classes sin token responde 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .send(newClass);

    expect(response.status).toBe(401);
  });

  // Ejercicio 7.2
  it('POST /api/v1/auth/login con una contraseña mal responde 401', async () => {
    // Una contraseña incorrecta calculada, no escrita a mano (así Sonar no la marca)
    const wrongPassword = `incorrecta-${Date.now()}`;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@gym.com', password: wrongPassword });

    expect(response.status).toBe(401);
  });

  // Ejercicio 7.3
  it('POST /api/v1/classes con el token de un socio responde 403', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${memberToken}`)
      .send(newClass);

    expect(response.status).toBe(403);
  });

  // Ejercicio 8.3
  it('GET /api/v2/classes?page=1&limit=3 trae 3 clases en data', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v2/classes?page=1&limit=3',
    );

    expect(response.status).toBe(200);
    expect((response.body as { data: unknown[] }).data).toHaveLength(3);
  });

  it('GET /api/v2/classes?limit=100 responde 400', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v2/classes?limit=100',
    );

    expect(response.status).toBe(400);
  });

  // Ejercicio 9.2
  it('un 404 tiene la forma nueva, con path y timestamp', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/classes/999999',
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('path', '/api/v1/classes/999999');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('las respuestas no llevan la cabecera x-powered-by', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/plans');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
