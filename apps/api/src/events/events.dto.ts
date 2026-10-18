import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { sanitizeEventRichText } from './event-rich-text.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const richText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? sanitizeEventRichText(value) : value;

export class SaveEventDto {
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @Transform(richText)
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description!: string;
  @Transform(richText)
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  activityDescription!: string;
  @Transform(richText)
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  rules!: string;
  @IsDateString({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  startsAt!: string;
  @IsInt() @Min(1) @Max(100000) capacity!: number;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(160) venueName!: string;
  @Transform(trim) @IsString() @MinLength(3) @MaxLength(300) address!: string;
  @Matches(/^\d{5}$/) cityCode!: string;
  @Transform(trim)
  @IsUrl({ protocols: ['https'], require_protocol: true, disallow_auth: true })
  @Matches(
    /^https:\/\/(?:www\.)?google\.com\/maps(?:\/|$)|^https:\/\/maps\.google\.com\/|^https:\/\/maps\.app\.goo\.gl\//i,
    { message: 'Pega un enlace válido de Google Maps.' },
  )
  @MaxLength(2048)
  mapLink!: string;
}
export class EventParamsDto {
  @IsMongoId() id!: string;
}
export class EventImageParamsDto extends EventParamsDto {
  @Matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i,
  )
  imageKey!: string;
}
export class EventListDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
}

/** Query accepted by the public catalogue. Its response never exposes organizer-only fields. */
export class PublicEventListDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Matches(/^\d{5}$/) cityCode?: string;
}
