import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MoonEvent } from './event.schema.js';
import { User } from '../auth/auth.schemas.js';

@Schema({ collection: 'registrations' })
export class EventRegistration {
  @Prop({ required: true, type: Types.ObjectId, ref: MoonEvent.name })
  eventId!: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  userId!: Types.ObjectId;
  @Prop({ required: true, enum: ['CONFIRMED'], default: 'CONFIRMED' })
  status!: 'CONFIRMED';
  @Prop({ required: true, default: Date.now }) registeredAt!: Date;
}

export const EventRegistrationSchema =
  SchemaFactory.createForClass(EventRegistration);
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventRegistrationSchema.index({ eventId: 1, status: 1, registeredAt: 1 });
