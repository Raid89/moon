import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventsService } from './events.service.js';
import { SaveEventDto } from './events.dto.js';
import { LocationsService } from '../locations/locations.service.js';

const owner = new Types.ObjectId();
const other = new Types.ObjectId();
const id = new Types.ObjectId();
const data = {
  title: 'Noche Moon',
  description: 'Un encuentro para conocer personas.',
  activityDescription: 'Juegos de mesa',
  rules: 'Respeto y puntualidad',
  startsAt: '2027-11-01T23:00:00Z',
  capacity: 50,
  venueName: 'Café Moon',
  address: 'Calle 10 # 5-20',
  cityCode: '11001',
  mapLink: 'https://www.google.com/maps/embed?pb=example',
} satisfies SaveEventDto;
const query = (value: unknown) => ({ exec: vi.fn().mockResolvedValue(value) });
function setup() {
  let state = {
    ...data,
    _id: id,
    organizerId: owner,
    startsAt: new Date(data.startsAt),
    status: 'DRAFT',
    timeZone: 'America/Bogota',
    publishedAt: undefined,
    imageKeys: [],
    __v: 0,
  };
  const matches = (filter: Record<string, unknown>) =>
    Object.entries(filter).every(
      ([key, value]) =>
        String(state[key as keyof typeof state]) === String(value),
    );
  const model = {
    findOne: vi.fn((filter) => query(matches(filter) ? { ...state } : null)),
    findOneAndUpdate: vi.fn((filter, update) => {
      if (!matches(filter)) return query(null);
      state = { ...state, ...update.$set, __v: state.__v + 1 };
      return query({ ...state });
    }),
    create: vi.fn((input) => Promise.resolve({ ...state, ...input })),
  };
  const storage = {
    uploadEventCover: vi
      .fn()
      .mockResolvedValue('a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp'),
    deleteEventImage: vi.fn().mockResolvedValue(undefined),
    readEventImage: vi.fn(),
  };
  const service = new EventsService(
    model as never,
    new LocationsService(),
    storage as never,
  );
  return { service, model, storage };
}
describe('Organizer events', () => {
  it('creates drafts and rejects unknown municipalities', async () => {
    const { service } = setup();
    expect(await service.create(owner, data)).toMatchObject({
      status: 'DRAFT',
      capacity: 50,
    });
    await expect(
      service.create(owner, { ...data, cityCode: '99999' }),
    ).rejects.toMatchObject({ response: { code: 'VALIDATION_FAILED' } });
  });
  it('hides other organizers events and prevents edits/publication', async () => {
    const { service } = setup();
    for (const operation of [
      () => service.get(other, String(id)),
      () => service.update(other, String(id), data),
      () => service.publish(other, String(id)),
    ])
      await expect(operation()).rejects.toMatchObject({
        response: { code: 'EVENT_NOT_FOUND' },
      });
  });
  it('publishes once and blocks all subsequent edits and publication', async () => {
    const { service } = setup();
    expect(await service.publish(owner, String(id))).toMatchObject({
      status: 'PUBLISHED',
    });
    await expect(
      service.update(owner, String(id), { ...data, capacity: 500 }),
    ).rejects.toMatchObject({ response: { code: 'EVENT_LOCKED' } });
    await expect(service.publish(owner, String(id))).rejects.toMatchObject({
      response: { code: 'EVENT_LOCKED' },
    });
    expect((await service.get(owner, String(id))).capacity).toBe(50);
  });
  it('allows publication without an image and rejects a past start date', async () => {
    const { service } = setup();
    await expect(service.publish(owner, String(id))).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
    const past = setup();
    await past.service.update(owner, String(id), {
      ...data,
      startsAt: '2020-01-01T12:00:00Z',
    });
    await expect(past.service.publish(owner, String(id))).rejects.toMatchObject(
      {
        response: { code: 'EVENT_INCOMPLETE' },
      },
    );
  });
  it('stores a cover privately and returns an API URL instead of an R2 URL', async () => {
    const { service, storage } = setup();
    const event = await service.uploadCover(owner, String(id), {
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      size: 3,
      mimetype: 'image/jpeg',
    });
    expect(storage.uploadEventCover).toHaveBeenCalledWith(
      String(id),
      expect.objectContaining({ size: 3 }),
    );
    expect(event.imageUrls).toEqual([
      `/api/organizer/events/${String(id)}/images/a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp`,
    ]);
  });
  it('detects a concurrent change while publishing', async () => {
    const { service, model } = setup();
    model.findOneAndUpdate.mockImplementationOnce(() => query(null));
    await expect(service.publish(owner, String(id))).rejects.toMatchObject({
      response: { code: 'CONFLICT' },
    });
  });
  it('rejects spoofed fields, fractional capacity, unsafe maps and ambiguous dates', async () => {
    expect(await validate(plainToInstance(SaveEventDto, data))).toHaveLength(0);
    for (const changes of [
      { role: 'ORGANIZER' },
      { organizerId: String(other) },
      { status: 'PUBLISHED' },
      { capacity: 2.5 },
      { mapLink: 'https://example.com/not-a-map' },
      { mapLink: 'javascript:alert(1)' },
      { startsAt: '2027-11-01T18:00:00' },
    ]) {
      expect(
        (
          await validate(
            plainToInstance(SaveEventDto, { ...data, ...changes }),
            { whitelist: true, forbidNonWhitelisted: true },
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
  it('stores the supported Quill HTML and removes unsafe markup', async () => {
    const rich = plainToInstance(SaveEventDto, {
      ...data,
      description:
        '<p><strong>Conecta</strong> <a href="javascript:alert(1)" onclick="alert(1)">aquí</a></p><script>alert(1)</script><img src="https://cdn.example.com/moon.jpg" onerror="alert(1)">',
      activityDescription: '<ul><li>Rompe el hielo</li></ul>',
      rules: '<p>Respeta a todas las personas.</p>',
    });
    expect(await validate(rich)).toHaveLength(0);
    const { service } = setup();
    const event = await service.create(owner, rich);
    expect(event.description).toBe(
      '<p><strong>Conecta</strong> <a target="_blank" rel="noopener noreferrer">aquí</a></p><img src="https://cdn.example.com/moon.jpg" />',
    );
    expect(event.activityDescription).toBe('<ul><li>Rompe el hielo</li></ul>');
  });
});

describe('Public event catalogue', () => {
  const published = {
    ...data,
    _id: id,
    organizerId: owner,
    startsAt: new Date('2027-11-01T23:00:00Z'),
    status: 'PUBLISHED' as const,
    timeZone: 'America/Bogota',
    publishedAt: new Date(),
    imageKeys: ['a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp'],
    __v: 1,
  };
  function publicSetup() {
    const exec = vi.fn().mockResolvedValue([published]);
    const find = vi.fn(() => ({
      sort: vi.fn(() => ({
        skip: vi.fn(() => ({ limit: vi.fn(() => ({ exec })) })),
      })),
    }));
    const countDocuments = vi.fn(() => query(1));
    const findOne = vi.fn(() => query(published));
    const storage = {
      readEventImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from('x'),
        contentType: 'image/webp',
      }),
    };
    const service = new EventsService(
      {
        find,
        countDocuments,
        findOne,
        distinct: vi.fn(() => query(['11001'])),
      } as never,
      new LocationsService(),
      storage as never,
    );
    return { service, find, storage };
  }

  it('lists only future published events in fixed pages without organizer-only fields', async () => {
    const { service, find } = publicSetup();
    const result = await service.listPublic({
      page: 1,
      q: 'Café',
      cityCode: '11001',
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PUBLISHED',
        cityCode: '11001',
        startsAt: { $gte: expect.any(Date) },
        $or: expect.any(Array),
      }),
    );
    expect(result).toMatchObject({ total: 1, page: 1, pageSize: 12 });
    expect(result.events[0]).toEqual(
      expect.objectContaining({
        id: String(id),
        confirmedCount: 0,
        imageUrls: [
          `/api/events/${String(id)}/images/a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp`,
        ],
      }),
    );
    expect(result.events[0]).not.toHaveProperty('organizerId');
    expect(result.events[0]).not.toHaveProperty('description');
  });

  it('streams only an image belonging to a published event', async () => {
    const { service, storage } = publicSetup();
    await expect(
      service.publicImage(
        String(id),
        'a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp',
      ),
    ).resolves.toMatchObject({ contentType: 'image/webp' });
    expect(storage.readEventImage).toHaveBeenCalledWith(
      String(id),
      'a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp',
    );
  });

  it('does not expose images when the event is not published or the key is unknown', async () => {
    const storage = { readEventImage: vi.fn() };
    const service = new EventsService(
      { findOne: vi.fn(() => query(null)) } as never,
      new LocationsService(),
      storage as never,
    );
    await expect(
      service.publicImage(
        String(id),
        'a0f8be88-a44c-47c2-9b1a-2e508d8f3b22.webp',
      ),
    ).rejects.toMatchObject({ response: { code: 'EVENT_IMAGE_NOT_FOUND' } });
    expect(storage.readEventImage).not.toHaveBeenCalled();
  });
});
