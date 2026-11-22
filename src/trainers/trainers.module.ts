import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { PhotosService } from './photos.service';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

@Module({
  imports: [
    DatabaseModule, // para que TrainersService pueda pedir el Pool
    UsersModule, // para que los guards puedan pedir el UsersService
  ],
  controllers: [TrainersController],
  providers: [TrainersService, PhotosService],
})
export class TrainersModule {}
