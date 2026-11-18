import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { User } from '../users/user';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload';

// Una petición que ya ha pasado el guard: lleva el usuario
export interface AuthRequest extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // 1. La cabecera tiene que ser "Authorization: Bearer <token>"
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token'); // → 401
    }

    // 2. ¿La firma es buena y no ha caducado?
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('El token no es válido'); // → 401
    }

    // 3. ¿Sigue existiendo el usuario? Lo leemos de la base de datos
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('El usuario del token ya no existe'); // → 401
    }

    // 4. Lo dejamos en la petición para que lo use la ruta
    request.user = user;
    return true;
  }
}
