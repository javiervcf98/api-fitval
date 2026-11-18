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
import { AuthGuard } from './auth.guard';
import type { AuthRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth') // rutas /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') // POST /api/auth/register → 201
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login') // POST /api/auth/login → 200 (no crea nada)
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me') // GET /api/auth/me → solo con token
  @UseGuards(AuthGuard)
  me(@Req() request: AuthRequest) {
    return request.user; // lo dejó ahí el guard
  }
}
