import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { LocationsService } from '../locations/locations.service.js';
import { RegistrationsService } from './registrations.service.js';

const eventId = new Types.ObjectId();
const userId = new Types.ObjectId();
const registeredAt = new Date('2026-11-16T16:00:00.000Z');

function query<T>(value: T) {
  const exec = vi.fn().mockResolvedValue(value);
  const session = vi.fn(() => ({ exec }));
  return { exec, session };
}

function setup({ existing = null, reserve = true } = {}) {
  const session = {
    withTransaction: vi.fn(async (work: () => Promise<void>) => work()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  const visibleEvent = {
    _id: eventId,
    title: 'Noche Moon',
    startsAt: new Date('2027-11-01T23:00:00.000Z'),
    capacity: 2,
    confirmedCount: 1,
    status: 'PUBLISHED',
    organizerId: new Types.ObjectId(),
  };
  const events = {
    findOneAndUpdate: vi.fn(() => query(reserve ? visibleEvent : null)),
    findById: vi.fn(() => query(visibleEvent)),
    findOne: vi.fn(() => query(visibleEvent)),
  };
  const registrations = {
    findOne: vi.fn(() => query(existing)),
    create: vi.fn().mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        eventId,
        userId,
        status: 'CONFIRMED',
        registeredAt,
      },
    ]),
    find: vi.fn(),
  };
  const users = { find: vi.fn() };
  const service = new RegistrationsService(
    events as never,
    registrations as never,
    users as never,
    { startSession: vi.fn().mockResolvedValue(session) } as never,
    new LocationsService(),
  );
  return { service, events, registrations, session };
}

describe('RegistrationsService', () => {
  it('reserves a slot and creates the registration in one transaction', async () => {
    const { service, events, registrations, session } = setup();
    const result = await service.register(
      { _id: userId } as never,
      String(eventId),
    );

    expect(result).toMatchObject({
      alreadyRegistered: false,
      confirmedCount: 1,
      registration: { registeredAt: registeredAt.toISOString() },
    });
    expect(session.withTransaction).toHaveBeenCalledOnce();
    expect(events.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: eventId,
        status: 'PUBLISHED',
        startsAt: { $gte: expect.any(Date) },
        $expr: { $lt: [{ $ifNull: ['$confirmedCount', 0] }, '$capacity'] },
      }),
      { $inc: { confirmedCount: 1 } },
      expect.objectContaining({ new: true, session }),
    );
    expect(registrations.create).toHaveBeenCalledWith(
      [expect.objectContaining({ eventId, userId, status: 'CONFIRMED' })],
      { session },
    );
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('is idempotent and does not consume another slot for an existing registration', async () => {
    const existing = {
      _id: new Types.ObjectId(),
      eventId,
      userId,
      status: 'CONFIRMED',
      registeredAt,
    };
    const { service, events, registrations } = setup({ existing });

    const result = await service.register(
      { _id: userId } as never,
      String(eventId),
    );

    expect(result).toMatchObject({
      alreadyRegistered: true,
      confirmedCount: 1,
    });
    expect(events.findOneAndUpdate).not.toHaveBeenCalled();
    expect(registrations.create).not.toHaveBeenCalled();
  });

  it('rejects a visible event when no slot remains', async () => {
    const { service, registrations } = setup({ reserve: false });

    await expect(
      service.register({ _id: userId } as never, String(eventId)),
    ).rejects.toMatchObject({
      response: { code: 'EVENT_FULL' },
    });
    expect(registrations.create).not.toHaveBeenCalled();
  });

  it('only returns attendee contact data to the owner of the event', async () => {
    const organizerId = new Types.ObjectId();
    const registeredUser = {
      _id: userId,
      name: 'Lina Torres',
      email: 'lina@example.com',
      cityCode: '11001',
    };
    const registration = {
      _id: new Types.ObjectId(),
      eventId,
      userId,
      status: 'CONFIRMED',
      registeredAt,
    };
    const find = vi.fn(() => ({
      sort: vi.fn(() => ({
        lean: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue([registration]),
        })),
      })),
    }));
    const users = {
      find: vi.fn(() => ({
        select: vi.fn(() => ({
          lean: vi.fn(() => ({
            exec: vi.fn().mockResolvedValue([registeredUser]),
          })),
        })),
      })),
    };
    const events = {
      findOne: vi.fn(() =>
        query({
          _id: eventId,
          organizerId,
          title: 'Noche Moon',
          startsAt: new Date('2027-11-01T23:00:00.000Z'),
          capacity: 20,
          confirmedCount: 1,
        }),
      ),
    };
    const service = new RegistrationsService(
      events as never,
      { find } as never,
      users as never,
      {} as never,
      new LocationsService(),
    );

    const result = await service.listForOrganizer(organizerId, String(eventId));

    expect(events.findOne).toHaveBeenCalledWith({
      _id: eventId,
      organizerId,
    });
    expect(find).toHaveBeenCalledWith({
      eventId,
      status: 'CONFIRMED',
    });
    expect(result.registrations).toEqual([
      {
        id: String(registration._id),
        name: 'Lina Torres',
        email: 'lina@example.com',
        cityName: 'BOGOTÁ, D.C.',
        registeredAt: registeredAt.toISOString(),
      },
    ]);
  });
});
