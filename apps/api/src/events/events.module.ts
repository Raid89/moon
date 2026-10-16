import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizerGuard } from '../auth/organizer.guard.js';
import { LocationsModule } from '../locations/locations.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { MoonEvent, MoonEventSchema } from './event.schema.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [
    AuthModule,
    LocationsModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: MoonEvent.name, schema: MoonEventSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, OrganizerGuard],
})
export class EventsModule {}
