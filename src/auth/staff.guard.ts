import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { AuthRequest } from './auth.guard';

// Va siempre DESPUÉS de AuthGuard, que ha dejado el usuario en la petición
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // Volvemos a leer el usuario de la base de datos, con su rol actual
    const user = await this.usersService.findById(request.user.id);

    if (!user) {
      throw new UnauthorizedException('El usuario ya no existe'); // → 401
    }

    if (user.role !== 'staff') {
      throw new ForbiddenException('Solo para el personal del gimnasio'); // → 403
    }

    return true;
  }
}
