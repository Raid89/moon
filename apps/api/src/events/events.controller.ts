import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  OrganizerGuard,
  type OrganizerRequest,
} from '../auth/organizer.guard.js';
import {
  EventImageParamsDto,
  EventListDto,
  EventParamsDto,
  PublicEventListDto,
  SaveEventDto,
} from './events.dto.js';
import { EventsService } from './events.service.js';
import type { UploadedImage } from '../storage/r2-storage.service.js';

@Controller('organizer/events')
@UseGuards(OrganizerGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Get() list(@Req() req: OrganizerRequest, @Query() query: EventListDto) {
    return this.events.list(req.user._id, query.page);
  }
  @Get(':id') async get(
    @Req() req: OrganizerRequest,
    @Param() params: EventParamsDto,
  ) {
    return {
      event: this.events.serialize(
        await this.events.get(req.user._id, params.id),
      ),
    };
  }
  @Post() async create(
    @Req() req: OrganizerRequest,
    @Body() dto: SaveEventDto,
  ) {
    return { event: await this.events.create(req.user._id, dto) };
  }
  @Patch(':id') async update(
    @Req() req: OrganizerRequest,
    @Param() params: EventParamsDto,
    @Body() dto: SaveEventDto,
  ) {
    return { event: await this.events.update(req.user._id, params.id, dto) };
  }
  @Post(':id/publish') async publish(
    @Req() req: OrganizerRequest,
    @Param() params: EventParamsDto,
  ) {
    return { event: await this.events.publish(req.user._id, params.id) };
  }
  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  async uploadCover(
    @Req() req: OrganizerRequest,
    @Param() params: EventParamsDto,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    if (!file)
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Selecciona una imagen JPG, PNG o WebP.',
      });
    return {
      event: await this.events.uploadCover(req.user._id, params.id, file),
    };
  }
  @Delete(':id/cover') async removeCover(
    @Req() req: OrganizerRequest,
    @Param() params: EventParamsDto,
  ) {
    return { event: await this.events.removeCover(req.user._id, params.id) };
  }
  @Get(':id/images/:imageKey') async image(
    @Req() req: OrganizerRequest,
    @Param() params: EventImageParamsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.events.image(
      req.user._id,
      params.id,
      params.imageKey,
    );
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': image.contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(image.bytes);
  }
}

@Controller('events')
export class PublicEventsController {
  constructor(private readonly events: EventsService) {}

  @Get('cities') cities() {
    return this.events.publicCities().then((cities) => ({ cities }));
  }

  @Get()
  list(@Query() query: PublicEventListDto) {
    return this.events.listPublic(query);
  }

  @Get(':id/images/:imageKey')
  async image(
    @Param() params: EventImageParamsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.events.publicImage(params.id, params.imageKey);
    response.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': image.contentType,
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(image.bytes);
  }
}
