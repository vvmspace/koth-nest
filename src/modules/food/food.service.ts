import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { TGService } from 'modules/tg/tg.service';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';

@Injectable()
export class FoodService {
  constructor(
    private userService: UsersService,
    @Inject(forwardRef(() => TGService))
    private readonly tgService: TGService,
  ) {}

  async shareFood(telegramReferrerId: string, user?: Partial<User>) {
    console.log('Sharing food with', telegramReferrerId);
    const referrer = await this.giveSandwich(telegramReferrerId);
    if (user) {
      await this.tgService.sendTelegramMessage(
        telegramReferrerId,
        `🥪 ${
          user?.name || user?.telegramUsername || user?.telegramId
        } gave you a sandwich!`,
      ).catch(e => console.warn('Failed to send message: ' + e.message));
    }
    console.log(
      'Given sandwich to',
      referrer.name || referrer.telegramUsername,
      referrer.telegramId,
    );
    if (
      !referrer.telegramReferrerId ||
      referrer.telegramReferrerId === referrer.telegramId
    ) {
      return;
    }
    await this.giveCoffee(referrer.telegramReferrerId);
    console.log('Given coffee to', referrer.telegramReferrerId);
    if (user) {
      await this.tgService.sendTelegramMessage(
        referrer.telegramReferrerId,
        `☕️ some friend of ${
          user?.name || user?.telegramUsername || user?.telegramId
        } gave you a coffee!`,
      );
    }
  }

  async giveCoffee(telegramId: string, count = 1) {
    const user = await this.userService.getByTelegramId(telegramId);

    if (!user) {
      console.log('User not found', telegramId);
      return null;
    }

    user.coffees += count;

    await this.userService.update(user.id, user);
    return user;
  }

  async giveSandwich(telegramId: string, count = 1) {
    const user = await this.userService.getByTelegramId(telegramId);

    if (!user) {
      console.log('User not found', telegramId);
      return null;
    }

    user.sandwiches += count;

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

  async useBonus(user: Partial<User>) {
    if (
      user.lastBonus &&
      new Date().getTime() - user.lastBonus.getTime() < 86400000
    ) {
      return;
    }
    user.lastBonus = new Date();
    user.steps += Math.floor(Math.random() * 50) + 1;
    await this.userService.update(user.id, user);
    await this.giveCoffee(user.telegramId, Math.floor(Math.random() * 5) + 1);
    await this.giveSandwich(user.telegramId, Math.floor(Math.random() * 3) + 1);
    console.log(
      'Given bonus to',
      user.name || user.telegramUsername,
      user.telegramId,
    );
    await this.tgService.sendAdminMessage(`${user.name || user.telegramUsername},
      ${user.telegramId} activated bonus`)
      .catch(e => console.warn('Failed to send message: ' + e.message));
  }
}
