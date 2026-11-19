import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthRequest } from './auth.guard';

// Va siempre DESPUÉS de AuthGuard, que ya ha dejado el usuario en la petición
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (request.user.role !== 'staff') {
      throw new ForbiddenException('Solo para el personal del gimnasio'); // → 403
    }

    return true;
  }
}
