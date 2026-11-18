import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule], // para que UsersService pueda pedir el Pool
  providers: [UsersService],
  exports: [UsersService], // para que AuthModule (y luego ClassesModule) puedan usarlo
})
export class UsersModule {}
