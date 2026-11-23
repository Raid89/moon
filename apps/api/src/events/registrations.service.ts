import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { ClientSession, Connection } from 'mongoose';
import type { UserDocument } from '../auth/auth.schemas.js';
import { User } from '../auth/auth.schemas.js';
import { LocationsService } from '../locations/locations.service.js';
import { MoonEvent } from './event.schema.js';
import { EventRegistration } from './registration.schema.js';

export interface RegistrationResult {
  alreadyRegistered: boolean;
  confirmedCount: number;
  registration: { id: string; registeredAt: string };
}

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(MoonEvent.name) private readonly events: Model<MoonEvent>,
    @InjectModel(EventRegistration.name)
    private readonly registrations: Model<EventRegistration>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly locations: LocationsService,
  ) {}

  async register(
    user: UserDocument,
    eventId: string,
  ): Promise<RegistrationResult> {
    const eventObjectId = new Types.ObjectId(eventId);
    const session = await this.connection.startSession();
    let result: RegistrationResult | undefined;
    try {
      await session.withTransaction(async () => {
        const existing = await this.registrations
          .findOne({
            eventId: eventObjectId,
            userId: user._id,
            status: 'CONFIRMED',
          })
          .session(session)
          .exec();
        if (existing) {
          const event = await this.events
            .findById(eventObjectId)
            .session(session)
            .exec();
          if (!event) throw this.notFound();
          result = {
            alreadyRegistered: true,
            confirmedCount: event.confirmedCount ?? 0,
            registration: this.serialize(existing),
          };
          return;
        }

        const event = await this.events
          .findOneAndUpdate(
            {
              _id: eventObjectId,
              status: 'PUBLISHED',
              startsAt: { $gte: new Date() },
              $expr: {
                $lt: [{ $ifNull: ['$confirmedCount', 0] }, '$capacity'],
              },
            },
            { $inc: { confirmedCount: 1 } },
            { new: true, session },
          )
          .exec();
        if (!event) await this.throwUnavailableOrFull(eventObjectId, session);

        const [registration] = await this.registrations.create(
          [
            {
              eventId: eventObjectId,
              userId: user._id,
              status: 'CONFIRMED',
              registeredAt: new Date(),
            },
          ],
          { session },
        );
        result = {
          alreadyRegistered: false,
          confirmedCount: event!.confirmedCount,
          registration: this.serialize(registration),
        };
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }

  async listForOrganizer(organizerId: Types.ObjectId, eventId: string) {
    const eventObjectId = new Types.ObjectId(eventId);
    const event = await this.events
      .findOne({ _id: eventObjectId, organizerId })
      .exec();
    if (!event) throw this.notFound();

    const registrations = await this.registrations
      .find({ eventId: eventObjectId, status: 'CONFIRMED' })
      .sort({ registeredAt: 1 })
      .lean()
      .exec();
    const users = await this.users
      .find({
        _id: { $in: registrations.map((registration) => registration.userId) },
      })
      .select({ name: 1, email: 1, cityCode: 1 })
      .lean()
      .exec();
    const usersById = new Map(
      users.map((registeredUser) => [
        String(registeredUser._id),
        registeredUser,
      ]),
    );

    return {
      event: {
        id: String(event._id),
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        capacity: event.capacity,
        confirmedCount: event.confirmedCount ?? 0,
      },
      registrations: registrations.flatMap((registration) => {
        const registeredUser = usersById.get(String(registration.userId));
        if (!registeredUser) return [];
        return [
          {
            id: String(registration._id),
            name: registeredUser.name ?? 'Perfil sin nombre',
            email: registeredUser.email,
            cityName: registeredUser.cityCode
              ? (this.locations.municipality(registeredUser.cityCode)?.name ??
                '')
              : '',
            registeredAt: registration.registeredAt.toISOString(),
          },
        ];
      }),
    };
  }

  private async throwUnavailableOrFull(
    eventId: Types.ObjectId,
    session: ClientSession,
  ) {
    const event = await this.events
      .findOne({
        _id: eventId,
        status: 'PUBLISHED',
        startsAt: { $gte: new Date() },
      })
      .session(session)
      .exec();
    if (!event) throw this.notFound();
    throw new ConflictException({
      code: 'EVENT_FULL',
      message: 'Este evento ya completó sus cupos.',
    });
  }

  private serialize(registration: EventRegistration & { _id: Types.ObjectId }) {
    return {
      id: String(registration._id),
      registeredAt: registration.registeredAt.toISOString(),
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'EVENT_NOT_FOUND',
      message: 'No encontramos este evento disponible.',
    });
  }
}
