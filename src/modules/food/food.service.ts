import { Injectable } from '@nestjs/common';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';

@Injectable()
export class FoodService {
  constructor(private userService: UsersService) {}

  async shareFood(telegramReferrerId: number) {
    const referrer = await this.giveSandwich(telegramReferrerId);
    console.log('Given sandwich to', telegramReferrerId);
    if (!referrer.telegramReferrerId) {
      return;
    }
    await this.giveCoffee(referrer.telegramReferrerId);
    console.log('Given coffee to', referrer.telegramReferrerId);
  }

  async giveCoffee(telegramId: number) {
    const user = await this.userService.getByTelegramId(telegramId);

    if (!user) {
        console.log('User not found', telegramId);
      return null;
    }

    user.coffees++;

    await this.userService.update(user.id, user);
    return user;
  }

  async giveSandwich(telegramId: number) {
    const user = await this.userService.getByTelegramId(telegramId);

    if (!user) {
    console.log('User not found', telegramId);
      return null;
    }

    user.sandwiches++;

    await this.userService.update(user.id, user);
    return user;
  }

  async useCoffee(user: Partial<User>) {
    if (user.coffees > 0) {
      user.coffees--;
      user.steps += 1;
    }

    await this.userService.update(user.id, user);
    return user;
  }

  async useSandwich(user: Partial<User>) {
    if (user.sandwiches > 0) {
      user.sandwiches--;
      user.steps += 3;
    }

    await this.userService.update(user.id, user);
    return user;
  }
}
