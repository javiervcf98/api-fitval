import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

@Module({
  imports: [
    DatabaseModule, // para que ClassesService pueda pedir el Pool
    UsersModule, // para que los guards puedan pedir el UsersService
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
