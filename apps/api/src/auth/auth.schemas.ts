import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;
  @Prop({ trim: true, maxlength: 100 }) name?: string;
  @Prop({ trim: true, match: /^\d{5}$/ }) cityCode?: string;
  @Prop({ required: true, enum: ['USER', 'ORGANIZER'], default: 'USER' })
  role!: 'USER' | 'ORGANIZER';
}
export const UserSchema = SchemaFactory.createForClass(User);

export type OtpChallengeDocument = HydratedDocument<OtpChallenge>;
@Schema({ timestamps: true, collection: 'otp_challenges' })
export class OtpChallenge {
  @Prop({ required: true, index: true }) email!: string;
  @Prop({ required: true, unique: true, index: true }) challengeId!: string;
  @Prop({ required: true }) verificationHash!: string;
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop({ default: 0 }) attempts!: number;
  @Prop() usedAt?: Date;
}
export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);

export type SessionDocument = HydratedDocument<Session>;
@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ required: true, ref: User.name, index: true })
  userId!: Types.ObjectId;
  @Prop({ required: true, unique: true, index: true }) tokenHash!: string;
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop() revokedAt?: Date;
}
export const SessionSchema = SchemaFactory.createForClass(Session);

@Schema({ timestamps: true, collection: 'auth_rate_limits' })
export class AuthRateLimit {
  @Prop({ required: true, unique: true }) key!: string;
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop({ default: 0 }) count!: number;
}
export const AuthRateLimitSchema = SchemaFactory.createForClass(AuthRateLimit);
