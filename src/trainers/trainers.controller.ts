import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { StaffGuard } from '../auth/staff.guard';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { PhotosService } from './photos.service';
import { TrainersService } from './trainers.service';

@ApiTags('trainers')
@Controller('trainers') // rutas /api/v1/trainers
export class TrainersController {
  constructor(
    private readonly trainersService: TrainersService,
    private readonly photosService: PhotosService,
  ) {}

  @Get(':id') // GET /api/v1/trainers/:id (público)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trainersService.findOne(id);
  }

  @Post() // POST /api/v1/trainers → solo staff
  @ApiBearerAuth()
  @UseGuards(AuthGuard, StaffGuard)
  create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @Post(':id/photo') // POST /api/v1/trainers/:id/photo → solo staff
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data') // Swagger: se envía como form-data...
  @ApiBody({
    // ...con un campo "photo" de tipo fichero (así sale el botón de elegir archivo)
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @UseGuards(AuthGuard, StaffGuard)
  @UseInterceptors(
    // Lee el fichero del campo "photo". Por encima de 10 MB ni lo recibe
    FileInterceptor('photo', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.trainersService.findOne(id); // 404 si el monitor no existe
    const photoUrl = await this.photosService.save(file); // 400 si la foto no vale
    return this.trainersService.setPhoto(id, photoUrl);
  }
}
