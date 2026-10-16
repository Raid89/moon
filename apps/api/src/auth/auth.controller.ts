import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RequestOtpDto, VerifyOtpDto } from './auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('otp/request') async request(
    @Body() dto: RequestOtpDto,
    @Req() req: Request,
  ) {
    return this.auth.requestOtp(dto.email, req.ip ?? 'unknown');
  }
  @Post('otp/verify') async verify(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.verifyOtp(
      dto.challengeId,
      dto.code,
      req.ip ?? 'unknown',
    );
    res.cookie(
      this.auth.cookieName(),
      result.sessionToken,
      this.auth.cookieOptions(),
    );
    return { user: this.auth.serialize(result.user) };
  }
  @Get('me') async me(@Req() req: Request) {
    return {
      user: this.auth.serialize(
        await this.auth.currentUser(req.cookies?.[this.auth.cookieName()]),
      ),
    };
  }
  @Post('logout') async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies?.[this.auth.cookieName()]);
    res.clearCookie(this.auth.cookieName(), this.auth.cookieOptions());
    return { ok: true };
  }
}
