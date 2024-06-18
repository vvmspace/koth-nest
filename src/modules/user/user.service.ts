import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async get(id: number) {
    return this.userRepository.findOne({ id });
  }

  async getByTelegramId(telegramId: number) {
    return await this.userRepository.findOne({ telegramId });
  }

  async create(payload: Partial<User>) {
    const user = await this.getByTelegramId(payload.telegramId);

    if (user) {
      throw new NotAcceptableException(
        'User with provided telegramId already created.',
      );
    }

    return await this.userRepository.save(payload);
  }

  async update(id: number, payload: Partial<User>) {
    await this.userRepository.update(id, payload);
    return this.get(id);
  }
}
