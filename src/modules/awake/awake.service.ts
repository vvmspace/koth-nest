import { Injectable } from '@nestjs/common';
import { AWAKE_INTERVAL } from 'consants/awake.constants';
import { ConfigService } from 'modules/config';
import { FoodService } from 'modules/food/food.service';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';

@Injectable()
export class AwakeService {
  constructor(
    private userService: UsersService,
    private foodService: FoodService,
    private configService: ConfigService,
  ) {}

  async awake(user: Partial<User>) {
    const awakeInterval = this.configService.getInt(
      'AWAKE_INTERVAL',
      AWAKE_INTERVAL,
    );

    const lastAwakeMs = user.lastAwake?.getTime() || 0;
    const lastAwake = user.lastAwake;
    const nextAwakeMs = lastAwakeMs + awakeInterval;
    const nextAwake = new Date(nextAwakeMs);

    const diff = Date.now() - (lastAwake?.getTime() || 0);


    if (diff > awakeInterval) {
      user.lastAwake = new Date();
      user.steps += 10;
      if (user.telegramReferrerId) {
        await this.foodService.giveCoffee(user.telegramReferrerId);
      }
      await this.userService.update(user.id, user);
      await this.giveBreakfast(user.telegramId);
      console.log('Awake', user, user.lastAwake, diff);
    }

    return { user, nextAwake };
  }

  async giveBreakfast(telegramId: number) {
    await this.foodService.giveCoffee(telegramId);
    await this.foodService.giveSandwich(telegramId);
  }
}
