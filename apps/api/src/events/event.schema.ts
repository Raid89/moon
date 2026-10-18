import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'events' })
export class MoonEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  organizerId!: Types.ObjectId;
  @Prop({ required: true, maxlength: 160 }) title!: string;
  @Prop({ required: true, maxlength: 10000 }) description!: string;
  @Prop({ required: true, maxlength: 5000 }) activityDescription!: string;
  @Prop({ required: true, maxlength: 5000 }) rules!: string;
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ default: 'America/Bogota', immutable: true }) timeZone!: string;
  @Prop({ required: true, min: 1 }) capacity!: number;
  @Prop({ required: true }) venueName!: string;
  @Prop({ required: true }) address!: string;
  @Prop({ required: true }) cityCode!: string;
  @Prop({ required: true, maxlength: 2048 }) mapLink!: string;
  @Prop({ type: [String], default: [] }) imageKeys!: string[];
  @Prop({ enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT', required: true })
  status!: 'DRAFT' | 'PUBLISHED';
  @Prop() publishedAt?: Date;
}
export const MoonEventSchema = SchemaFactory.createForClass(MoonEvent);
MoonEventSchema.index({ organizerId: 1, _id: -1 });
MoonEventSchema.index({ status: 1, startsAt: 1 });
