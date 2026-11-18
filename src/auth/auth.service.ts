import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User } from '../users/user';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // POST /api/auth/register
  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email'); // → 409
    }

    // Nunca guardamos la contraseña: solo su hash
    const passwordHash = await argon2.hash(dto.password);
    return this.usersService.create(dto.email, passwordHash);
  }

  // POST /api/auth/login
  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // El mismo mensaje si no existe el email o si la contraseña está mal
    if (!user || !(await argon2.verify(user.password_hash, dto.password))) {
      throw new UnauthorizedException('Email o contraseña incorrectos'); // → 401
    }

    const payload: JwtPayload = { sub: user.id };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
