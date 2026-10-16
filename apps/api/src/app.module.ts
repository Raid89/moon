import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { appConfig, mongoConfig, r2Config } from './config/env.js';
import { LocationsModule } from './locations/locations.module.js';
import { EventsModule } from './events/events.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mongoConfig, r2Config],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
        user: config.get<string>('mongo.username'),
        pass: config.get<string>('mongo.password'),
        dbName: config.get<string>('mongo.database'),
        serverSelectionTimeoutMS: 10_000,
      }),
    }),
    LocationsModule,
    AuthModule,
    UsersModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
