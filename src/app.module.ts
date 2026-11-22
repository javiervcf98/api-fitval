import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { DatabaseModule } from './database/database.module';
import { PlansModule } from './plans/plans.module';
import { UsersModule } from './users/users.module';
import { TrainersModule } from './trainers/trainers.module';

@Module({
  imports: [
    // Límite general: 20 peticiones por minuto desde la misma IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    DatabaseModule, // para que AppController pueda pedir el Pool
    PlansModule,
    ClassesModule,
    UsersModule,
    AuthModule,
    TrainersModule,
  ],
  controllers: [AppController],
  providers: [
    // El ThrottlerGuard se aplica a TODAS las rutas
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
