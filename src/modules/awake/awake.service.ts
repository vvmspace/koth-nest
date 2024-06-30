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
    const nextAwakeMs = lastAwakeMs + awakeInterval;
    const nextAwake = new Date(nextAwakeMs);

    const diff = Date.now() - lastAwakeMs;

    if (diff > awakeInterval) {
      user.lastAwake = new Date();
      user.steps += 10;
      await this.userService.update(user.id, user);
      if (user.telegramReferrerId) {
        console.log('Sharing food with', user.telegramReferrerId);
        await this.foodService
          .shareFood(user.telegramReferrerId, user)
          .catch((e) => {
            console.error('Error sharing food', e);
          });
      }
      await this.giveBreakfast(user.telegramId);
      console.log('Awake', user.telegramId, user.name, user.lastAwake, diff);
    }

    return { user, nextAwake };
  }

  async giveBreakfast(telegramId: string) {
    await this.foodService.giveCoffee(telegramId);
    await this.foodService.giveSandwich(telegramId);
  }
}
