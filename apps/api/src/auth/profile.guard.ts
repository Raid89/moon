import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { UserDocument } from './auth.schemas.js';

export type ProfileRequest = Request & { user: UserDocument };

/** Requires a valid session and the minimum profile needed to join a Moon event. */
@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ProfileRequest>();
    const user = await this.auth.currentUser(
      req.cookies?.[this.auth.cookieName()],
    );
    if (!user.name || !user.cityCode)
      throw new ForbiddenException({
        code: 'PROFILE_INCOMPLETE',
        message: 'Completa tu perfil antes de inscribirte.',
      });
    req.user = user;
    return true;
  }
}
