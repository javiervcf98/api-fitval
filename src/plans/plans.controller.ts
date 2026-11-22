import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans') // rutas /api/v1/plans
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get() // GET /api/v1/plans
  findAll() {
    return this.plansService.findAll();
  }
}
