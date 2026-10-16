import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
@Module({
  imports: [AuthModule, LocationsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
