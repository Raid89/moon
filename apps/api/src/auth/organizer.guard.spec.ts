import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { OrganizerGuard } from './organizer.guard.js';

const query = (value: unknown) => ({ exec: vi.fn().mockResolvedValue(value) });
function setup(email = 'team@example.com', storedRole = 'USER') {
  const user = {
    email,
    role: storedRole,
    name: 'Moon',
    cityCode: '11001',
    save: vi.fn().mockResolvedValue(undefined),
  };
  const users = { findById: vi.fn(() => query(user)) };
  const sessions = { findOne: vi.fn(() => query({ userId: 'user' })) };
  const config = new ConfigService({
    app: { otpSecret: 'test-secret', organizerEmails: ['team@example.com'] },
  });
  const auth = new AuthService(
    users as never,
    {} as never,
    sessions as never,
    {} as never,
    config,
    {} as never,
    {} as never,
  );
  return { auth, user };
}
function context() {
  const req = { cookies: { moon_session: 'opaque-token' } };
  return {
    req,
    ctx: {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext,
  };
}
describe('Organizer authorization', () => {
  it('requires a session', async () => {
    const { auth } = setup();
    await expect(auth.currentUser()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it('promotes an existing user from the allowlist during session resolution', async () => {
    const { auth, user } = setup();
    const { ctx, req } = context();
    await expect(new OrganizerGuard(auth).canActivate(ctx)).resolves.toBe(true);
    expect(user.role).toBe('ORGANIZER');
    expect(user.save).toHaveBeenCalledOnce();
    expect(req).toHaveProperty('user', user);
  });
  it('revokes previously stored organizer privileges when email is no longer authorized', async () => {
    const { auth, user } = setup('removed@example.com', 'ORGANIZER');
    await expect(
      new OrganizerGuard(auth).canActivate(context().ctx),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(user.role).toBe('USER');
    expect(user.save).toHaveBeenCalledOnce();
  });
  it('normalizes email casing and denies unlisted accounts', () => {
    const { auth } = setup();
    expect(auth.roleForEmail(' TEAM@EXAMPLE.COM ')).toBe('ORGANIZER');
    expect(auth.roleForEmail('other@example.com')).toBe('USER');
  });
  it('requires a complete profile', async () => {
    const { auth, user } = setup();
    user.cityCode = '';
    await expect(
      new OrganizerGuard(auth).canActivate(context().ctx),
    ).rejects.toMatchObject({ response: { code: 'PROFILE_INCOMPLETE' } });
  });
});

describe('Organizer role during OTP registration', () => {
  it.each([
    ['team@example.com', 'ORGANIZER'],
    ['participant@example.com', 'USER'],
  ])(
    'assigns the server role to %s after verified OTP',
    async (email, role) => {
      const secret = 'test-secret';
      const challengeId = 'test-challenge';
      const code = '123456';
      const user = { _id: 'user-id', email, role };
      const users = { findOneAndUpdate: vi.fn(() => query(user)) };
      const challenges = {
        findOne: vi.fn(() =>
          query({
            _id: 'challenge-id',
            challengeId,
            email,
            attempts: 0,
            expiresAt: new Date(Date.now() + 60000),
            verificationHash: createHmac('sha256', secret)
              .update(`${challengeId}:${email}:${code}`)
              .digest('hex'),
          }),
        ),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      const sessions = { create: vi.fn().mockResolvedValue({}) };
      const limits = { findOneAndUpdate: vi.fn(() => query({ count: 1 })) };
      const config = new ConfigService({
        app: { otpSecret: secret, organizerEmails: ['team@example.com'] },
      });
      const auth = new AuthService(
        users as never,
        challenges as never,
        sessions as never,
        limits as never,
        config,
        {} as never,
        {} as never,
      );
      const result = await auth.verifyOtp(challengeId, code, '127.0.0.1');
      expect(result.user.role).toBe(role);
      expect(users.findOneAndUpdate).toHaveBeenCalledWith(
        { email },
        {
          $setOnInsert: { email },
          $set: { role },
        },
        { upsert: true, new: true },
      );
      expect(sessions.create).toHaveBeenCalledOnce();
    },
  );
});
