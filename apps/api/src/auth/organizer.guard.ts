import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { UserDocument } from './auth.schemas.js';

export type OrganizerRequest = Request & { user: UserDocument };

@Injectable()
export class OrganizerGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<OrganizerRequest>();
    const user = await this.auth.currentUser(
      req.cookies?.[this.auth.cookieName()],
    );
    if (user.role !== 'ORGANIZER')
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Este espacio es exclusivo del equipo Moon autorizado.',
      });
    if (!user.name || !user.cityCode)
      throw new ForbiddenException({
        code: 'PROFILE_INCOMPLETE',
        message: 'Completa tu perfil antes de gestionar eventos.',
      });
    req.user = user;
    return true;
  }
}
