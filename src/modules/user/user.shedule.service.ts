import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from './user.service';
import { ConfigService } from 'modules/config';

@Injectable()
export class UserScheduleService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  @Cron('*/15 * * * * *')
  async tick() {
    if (this.configService.get('DISABLE_TIMERS', 'false') == 'true') {
      // console.log('skipping tick');
      return;
    }
    const user = await this.userService.getReminderUser();
    if (!user) {
      return;
    }
    await this.userService.remind(user);
    console.log('Reminded', user.telegramId, user.name);
  }
}
