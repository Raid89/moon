import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:4200',
  otpSecret: process.env.OTP_SECRET ?? '',
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.RESEND_FROM ?? '',
  },
}));

export const mongoConfig = registerAs('mongo', () => ({
  uri: (process.env.MONGODB_URI ?? '').replace(
    /^(mongodb(?:\+srv)?:\/\/)(?:[^@/]+@)?/,
    '$1',
  ),
  username: process.env.MONGODB_USERNAME ?? '',
  password: process.env.MONGODB_PASSWORD ?? '',
  database: 'moon1',
}));
