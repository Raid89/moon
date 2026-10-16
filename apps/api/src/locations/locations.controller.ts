import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, Matches } from 'class-validator';
import { LocationsService } from './locations.service.js';
class MunicipalitiesQuery {
  @IsOptional() @Matches(/^\d{2}$/) departmentCode?: string;
}
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}
  @Get('departments') departments() {
    return { departments: this.locations.departments() };
  }
  @Get('municipalities') municipalities(@Query() query: MunicipalitiesQuery) {
    return {
      municipalities: query.departmentCode
        ? this.locations.municipalities(query.departmentCode)
        : [],
    };
  }
}
