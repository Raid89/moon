import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LocationsService } from '../locations/locations.service.js';
import {
  R2StorageService,
  type UploadedImage,
} from '../storage/r2-storage.service.js';
import { MoonEvent } from './event.schema.js';
import type { PublicEventListDto, SaveEventDto } from './events.dto.js';
import { sanitizeEventRichText } from './event-rich-text.js';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(MoonEvent.name) private readonly events: Model<MoonEvent>,
    private readonly locations: LocationsService,
    private readonly storage: R2StorageService,
  ) {}
  async list(organizerId: Types.ObjectId, page: number) {
    const filter = { organizerId };
    const [events, total] = await Promise.all([
      this.events
        .find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .exec(),
      this.events.countDocuments(filter).exec(),
    ]);
    return {
      events: events.map((event) => this.serialize(event)),
      total,
      page,
      pageSize: 20,
    };
  }
  async listPublic(query: PublicEventListDto) {
    const filter: Record<string, unknown> = {
      status: 'PUBLISHED',
      startsAt: { $gte: new Date() },
    };
    if (query.cityCode) filter.cityCode = query.cityCode;

    const search = query.q?.trim();
    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      const matchingCityCodes =
        this.locations.matchingMunicipalityCodes(search);
      filter.$or = [
        { title: expression },
        { venueName: expression },
        { address: expression },
        ...(matchingCityCodes.length
          ? [{ cityCode: { $in: matchingCityCodes } }]
          : []),
      ];
    }

    const pageSize = 12;
    const [events, total] = await Promise.all([
      this.events
        .find(filter)
        .sort({ startsAt: 1, _id: 1 })
        .skip((query.page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.events.countDocuments(filter).exec(),
    ]);
    return {
      events: events.map((event) => this.serializePublic(event)),
      total,
      page: query.page,
      pageSize,
    };
  }
  async publicCities() {
    const cityCodes = await this.events
      .distinct('cityCode', {
        status: 'PUBLISHED',
        startsAt: { $gte: new Date() },
      })
      .exec();
    return cityCodes
      .map((code) => this.locations.municipality(code))
      .filter((city): city is NonNullable<typeof city> => Boolean(city))
      .map(({ code, name }) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  async get(organizerId: Types.ObjectId, id: string) {
    const event = await this.events.findOne({ _id: id, organizerId }).exec();
    if (!event)
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'No encontramos este evento.',
      });
    return event;
  }
  async create(organizerId: Types.ObjectId, dto: SaveEventDto) {
    this.validateCity(dto.cityCode);
    return this.serialize(
      await this.events.create({
        ...this.payload(dto),
        organizerId,
        status: 'DRAFT',
      }),
    );
  }
  async update(organizerId: Types.ObjectId, id: string, dto: SaveEventDto) {
    this.validateCity(dto.cityCode);
    const event = await this.events
      .findOneAndUpdate(
        { _id: id, organizerId, status: 'DRAFT' },
        {
          $set: { ...this.payload(dto) },
          $inc: { __v: 1 },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!event) {
      await this.get(organizerId, id);
      throw this.locked();
    }
    return this.serialize(event);
  }
  async publish(organizerId: Types.ObjectId, id: string) {
    const draft = await this.get(organizerId, id);
    if (draft.status !== 'DRAFT') throw this.locked();
    if (draft.startsAt <= new Date())
      throw new BadRequestException({
        code: 'EVENT_INCOMPLETE',
        message: 'Para publicar necesitas una fecha futura.',
      });
    const event = await this.events
      .findOneAndUpdate(
        { _id: id, organizerId, status: 'DRAFT', __v: draft.__v },
        {
          $set: { status: 'PUBLISHED', publishedAt: new Date() },
          $inc: { __v: 1 },
        },
        { new: true },
      )
      .exec();
    if (!event)
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'El evento cambió. Recárgalo antes de publicar.',
      });
    return this.serialize(event);
  }
  async uploadCover(
    organizerId: Types.ObjectId,
    id: string,
    file: UploadedImage,
  ) {
    const draft = await this.get(organizerId, id);
    if (draft.status !== 'DRAFT') throw this.locked();
    const filename = await this.storage.uploadEventCover(id, file);
    const previousKeys = draft.imageKeys ?? [];
    const event = await this.events
      .findOneAndUpdate(
        { _id: id, organizerId, status: 'DRAFT', __v: draft.__v },
        { $set: { imageKeys: [filename] }, $inc: { __v: 1 } },
        { new: true },
      )
      .exec();
    if (!event) {
      await this.storage.deleteEventImage(id, filename);
      await this.get(organizerId, id);
      throw this.locked();
    }
    await Promise.all(
      previousKeys.map((key) => this.storage.deleteEventImage(id, key)),
    );
    return this.serialize(event);
  }
  async removeCover(organizerId: Types.ObjectId, id: string) {
    const draft = await this.get(organizerId, id);
    if (draft.status !== 'DRAFT') throw this.locked();
    const previousKeys = draft.imageKeys ?? [];
    if (!previousKeys.length) return this.serialize(draft);
    const event = await this.events
      .findOneAndUpdate(
        { _id: id, organizerId, status: 'DRAFT', __v: draft.__v },
        { $set: { imageKeys: [] }, $inc: { __v: 1 } },
        { new: true },
      )
      .exec();
    if (!event) {
      await this.get(organizerId, id);
      throw this.locked();
    }
    await Promise.all(
      previousKeys.map((key) => this.storage.deleteEventImage(id, key)),
    );
    return this.serialize(event);
  }
  async image(organizerId: Types.ObjectId, id: string, imageKey: string) {
    const event = await this.get(organizerId, id);
    if (!(event.imageKeys ?? []).includes(imageKey))
      throw new NotFoundException({
        code: 'EVENT_IMAGE_NOT_FOUND',
        message: 'No encontramos esta imagen.',
      });
    return this.storage.readEventImage(id, imageKey);
  }
  async publicImage(id: string, imageKey: string) {
    const event = await this.events
      .findOne({ _id: id, status: 'PUBLISHED', imageKeys: imageKey })
      .exec();
    if (!event)
      throw new NotFoundException({
        code: 'EVENT_IMAGE_NOT_FOUND',
        message: 'No encontramos esta imagen.',
      });
    return this.storage.readEventImage(id, imageKey);
  }
  serialize(event: MoonEvent & { _id: Types.ObjectId }) {
    return {
      id: String(event._id),
      title: event.title,
      description: event.description,
      activityDescription: event.activityDescription,
      rules: event.rules,
      startsAt: event.startsAt.toISOString(),
      timeZone: event.timeZone,
      capacity: event.capacity,
      venueName: event.venueName,
      address: event.address,
      cityCode: event.cityCode,
      cityName: this.locations.municipality(event.cityCode)?.name ?? '',
      mapLink: event.mapLink,
      imageUrls: (event.imageKeys ?? []).map(
        (imageKey) =>
          `/api/organizer/events/${String(event._id)}/images/${imageKey}`,
      ),
      status: event.status,
      publishedAt: event.publishedAt?.toISOString() ?? null,
    };
  }
  private serializePublic(event: MoonEvent & { _id: Types.ObjectId }) {
    return {
      id: String(event._id),
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      timeZone: event.timeZone,
      capacity: event.capacity,
      confirmedCount: 0,
      venueName: event.venueName,
      address: event.address,
      cityCode: event.cityCode,
      cityName: this.locations.municipality(event.cityCode)?.name ?? '',
      imageUrls: (event.imageKeys ?? []).map(
        (imageKey) => `/api/events/${String(event._id)}/images/${imageKey}`,
      ),
    };
  }
  private payload(dto: SaveEventDto) {
    return {
      title: dto.title,
      description: sanitizeEventRichText(dto.description),
      activityDescription: sanitizeEventRichText(dto.activityDescription),
      rules: sanitizeEventRichText(dto.rules),
      startsAt: new Date(dto.startsAt),
      capacity: dto.capacity,
      venueName: dto.venueName,
      address: dto.address,
      cityCode: dto.cityCode,
      mapLink: dto.mapLink,
    };
  }
  private validateCity(code: string) {
    if (!this.locations.municipality(code))
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Selecciona un municipio colombiano válido.',
      });
  }
  private locked() {
    return new ConflictException({
      code: 'EVENT_LOCKED',
      message: 'Los eventos publicados ya no se pueden editar.',
    });
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
