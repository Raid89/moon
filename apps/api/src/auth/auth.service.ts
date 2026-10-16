import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service.js';
import { LocationsService } from '../locations/locations.service.js';
import {
  AuthRateLimit,
  OtpChallenge,
  Session,
  User,
  type UserDocument,
} from './auth.schemas.js';

const OTP_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;
const COOKIE = 'moon_session';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(OtpChallenge.name)
    private readonly challenges: Model<OtpChallenge>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
    @InjectModel(AuthRateLimit.name)
    private readonly limits: Model<AuthRateLimit>,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly locations: LocationsService,
  ) {}

  async requestOtp(
    email: string,
    ip: string,
  ): Promise<{
    challengeId: string;
    expiresAt: string;
    resendAvailableAt: string;
  }> {
    this.requireSecret();
    await this.consumeLimit(`otp:email:${email}`, 5, 60 * 60_000);
    await this.consumeLimit(`otp:ip:${ip}`, 20, 60 * 60_000);
    const recent = await this.challenges.exists({
      email,
      createdAt: { $gt: new Date(Date.now() - 60_000) },
      usedAt: { $exists: false },
    });
    if (recent)
      throw this.rateLimited(
        'Espera un minuto antes de solicitar otro código.',
      );
    const challengeId = randomBytes(18).toString('base64url');
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await this.challenges.updateMany(
      { email, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } },
    );
    await this.challenges.create({
      email,
      challengeId,
      verificationHash: this.otpHash(challengeId, email, code),
      expiresAt,
    });
    try {
      await this.mail.sendOtp(email, code);
    } catch (error) {
      await this.challenges.deleteOne({ challengeId });
      throw error;
    }
    return {
      challengeId,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
    };
  }

  async verifyOtp(
    challengeId: string,
    code: string,
    ip: string,
  ): Promise<{ user: UserDocument; sessionToken: string }> {
    await this.consumeLimit(`verify:ip:${ip}`, 30, 60 * 60_000);
    const challenge = await this.challenges.findOne({ challengeId }).exec();
    if (
      !challenge ||
      challenge.usedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= 5
    )
      throw new UnauthorizedException({
        code: 'OTP_INVALID',
        message: 'El código no es válido o ya venció.',
      });
    const expected = this.otpHash(challengeId, challenge.email, code);
    if (
      !timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(challenge.verificationHash),
      )
    ) {
      await this.challenges.updateOne(
        {
          _id: challenge._id,
          usedAt: { $exists: false },
          attempts: { $lt: 5 },
        },
        { $inc: { attempts: 1 } },
      );
      throw new UnauthorizedException({
        code: 'OTP_INVALID',
        message: 'El código no es válido o ya venció.',
      });
    }
    const consumed = await this.challenges.updateOne(
      {
        _id: challenge._id,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
    );
    if (consumed.modifiedCount !== 1)
      throw new UnauthorizedException({
        code: 'OTP_INVALID',
        message: 'El código no es válido o ya venció.',
      });
    const user = await this.users
      .findOneAndUpdate(
        { email: challenge.email },
        { $setOnInsert: { email: challenge.email, role: 'USER' } },
        { upsert: true, new: true },
      )
      .exec();
    const sessionToken = randomBytes(32).toString('base64url');
    await this.sessions.create({
      userId: user._id,
      tokenHash: this.tokenHash(sessionToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return { user, sessionToken };
  }

  async currentUser(token?: string): Promise<UserDocument> {
    if (!token)
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Inicia sesión para continuar.',
      });
    const session = await this.sessions
      .findOne({
        tokenHash: this.tokenHash(token),
        expiresAt: { $gt: new Date() },
        revokedAt: { $exists: false },
      })
      .exec();
    if (!session)
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Tu sesión venció. Vuelve a ingresar.',
      });
    const user = await this.users.findById(session.userId).exec();
    if (!user)
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Tu sesión venció. Vuelve a ingresar.',
      });
    return user;
  }

  async logout(token?: string): Promise<void> {
    if (token)
      await this.sessions.updateOne(
        { tokenHash: this.tokenHash(token) },
        { $set: { revokedAt: new Date() } },
      );
  }
  serialize(user: UserDocument) {
    const city = user.cityCode
      ? this.locations.municipality(user.cityCode)
      : undefined;
    return {
      id: String(user._id),
      email: user.email,
      name: user.name ?? null,
      cityCode: user.cityCode ?? null,
      cityName: city?.name ?? null,
      role: user.role,
      profileComplete: Boolean(user.name && user.cityCode),
    };
  }
  cookieName(): string {
    return COOKIE;
  }
  cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get<boolean>('app.isProduction') ?? false,
      maxAge: SESSION_TTL_MS,
      path: '/',
    };
  }
  private otpHash(id: string, email: string, code: string): string {
    return createHmac('sha256', this.config.get<string>('app.otpSecret')!)
      .update(`${id}:${email}:${code}`)
      .digest('hex');
  }
  private tokenHash(token: string): string {
    return createHmac('sha256', this.config.get<string>('app.otpSecret')!)
      .update(`session:${token}`)
      .digest('hex');
  }
  private requireSecret(): void {
    if (!this.config.get<string>('app.otpSecret'))
      throw new ServiceUnavailableException({
        code: 'AUTH_NOT_CONFIGURED',
        message: 'El acceso por correo aún no está configurado.',
      });
  }
  private async consumeLimit(
    key: string,
    max: number,
    duration: number,
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration);
    const entry = await this.limits
      .findOneAndUpdate(
        { key },
        [
          {
            $set: {
              key,
              expiresAt: {
                $cond: [{ $gt: ['$expiresAt', now] }, '$expiresAt', expiresAt],
              },
              count: {
                $cond: [
                  { $gt: ['$expiresAt', now] },
                  { $add: [{ $ifNull: ['$count', 0] }, 1] },
                  1,
                ],
              },
            },
          },
        ],
        { new: true, upsert: true },
      )
      .exec();
    if (entry.count > max)
      throw this.rateLimited(
        'Has intentado demasiadas veces. Intenta de nuevo más tarde.',
      );
  }
  private rateLimited(message: string): HttpException {
    return new HttpException({ code: 'OTP_RATE_LIMITED', message }, 429);
  }
}
