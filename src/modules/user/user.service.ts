import {
  Inject,
  Injectable,
  NotAcceptableException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { TGService } from 'modules/tg/tg.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => TGService))
    private readonly tgService: TGService,
  ) {}

  async get(id: number) {
    return this.userRepository.findOne({ id });
  }

  async getByTelegramId(telegramId: string) {
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

  async count() {
    return this.userRepository.count();
  }

  async top() {
    return this.userRepository.find({
      order: {
        steps: 'DESC',
      },
      take: 10,
    });
  }

  async getReminderUser() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    // const TWO_DAYS = 2 * ONE_DAY;

    const lastBonusDate = new Date(Date.now() - ONE_DAY);
    const lastReminderDate = new Date(Date.now() - ONE_DAY);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.lastBonus is null OR user.lastBonus < :lastBonusDate) and (user.lastReminder is null OR user.lastReminder < :lastReminderDate)',
        { lastBonusDate, lastReminderDate },
      )
      .orderBy('user.lastReminder', 'ASC')
      .limit(1)
      .getMany();

    return result.length > 0 ? result[0] : null;
  }

  async remind(user: User) {
    if (!user) {
      return;
    }

    // could be null
    const diffDays = user.lastBonus
      ? (new Date().getTime() - user.lastBonus.getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

    user.lastReminder = new Date();
    await this.update(user.id, user);

    await this.tgService.sendTelegramMessage(
      user.telegramId,
      'Hey! Your daily bonus is ready!',
    );
    await this.tgService.sendAdminMessage(
      `Reminded ${
        user.telegramUsername || user.name || user.telegramId
      } in ${diffDays} days.`,
    );
  }
}
