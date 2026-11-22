import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from './auth.guard';
import type { AuthRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth') // rutas /api/v1/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // POST /api/v1/auth/register → 201
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login') // POST /api/v1/auth/login → 200 (no crea nada)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // máximo 5 intentos por minuto
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me') // GET /api/v1/auth/me → solo con token
  @UseGuards(AuthGuard)
  me(@Req() request: AuthRequest) {
    return request.user; // lo dejó ahí el guard
  }
}
