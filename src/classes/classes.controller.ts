import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { StaffGuard } from '../auth/staff.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';

@Controller('classes') // rutas /api/classes
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get() // GET /api/classes?activity=... (público)
  findAll(@Query('activity') activity?: string) {
    return this.classesService.findAll(activity);
  }

  @Get(':id') // GET /api/classes/:id (público)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.findOne(id);
  }

  @Post() // POST /api/classes → solo staff
  @UseGuards(AuthGuard, StaffGuard)
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Delete(':id') // DELETE /api/classes/:id → solo staff
  @UseGuards(AuthGuard, StaffGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classesService.remove(id);
  }
}
