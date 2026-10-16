import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service.js';
import { User, type UserDocument } from '../auth/auth.schemas.js';
import { LocationsService } from '../locations/locations.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly locations: LocationsService,
    private readonly auth: AuthService,
  ) {}
  async update(user: UserDocument, name: string, cityCode: string) {
    if (!this.locations.municipality(cityCode))
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Selecciona un municipio colombiano válido.',
      });
    const updated = await this.users
      .findByIdAndUpdate(user._id, { $set: { name, cityCode } }, { new: true })
      .exec();
    return this.auth.serialize(updated!);
  }
}
