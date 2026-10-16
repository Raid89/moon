import { Body, Controller, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { UpdateProfileDto } from './users.dto.js';
import { UsersService } from './users.service.js';
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}
  @Patch('me') async update(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const user = await this.auth.currentUser(
      req.cookies?.[this.auth.cookieName()],
    );
    return { user: await this.users.update(user, dto.name, dto.cityCode) };
  }
}
