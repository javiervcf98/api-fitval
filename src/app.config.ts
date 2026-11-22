import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

// La configuración de la API. La usan main.ts y los tests de integración
export function configureApp(app: INestApplication) {
  // Cabeceras de seguridad en todas las respuestas (y quita X-Powered-By)
  app.use(helmet());

  // Todas las rutas empiezan por /api
  app.setGlobalPrefix('api');

  // Versiones en la URL: /api/v1/..., /api/v2/... (por defecto, la v1)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Comprueba los DTO en todas las rutas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita los campos que no estén en el DTO...
      forbidNonWhitelisted: true, // ...o mejor: responde 400 si llegan
      transform: true, // aplica las transformaciones del DTO (como el trim)
    }),
  );

  // Todos los errores con la misma forma: statusCode, message, path y timestamp
  app.useGlobalFilters(new AllExceptionsFilter());
}
