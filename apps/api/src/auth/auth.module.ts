import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../mail/mail.module.js';
import { LocationsModule } from '../locations/locations.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  AuthRateLimit,
  AuthRateLimitSchema,
  OtpChallenge,
  OtpChallengeSchema,
  Session,
  SessionSchema,
  User,
  UserSchema,
} from './auth.schemas.js';
@Module({
  imports: [
    MailModule,
    LocationsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpChallenge.name, schema: OtpChallengeSchema },
      { name: Session.name, schema: SessionSchema },
      { name: AuthRateLimit.name, schema: AuthRateLimitSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, MongooseModule],
})
export class AuthModule {}
