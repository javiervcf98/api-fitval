import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule, // AuthService y AuthGuard necesitan UsersService
    JwtModule.registerAsync({
      global: true, // JwtService disponible en todos los módulos (lo usará ClassesModule)
      useFactory: () => ({
        secret: process.env.JWT_SECRET, // la clave para firmar los tokens
        signOptions: { expiresIn: '1h' }, // los tokens caducan en 1 hora
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
})
export class AuthModule {}
