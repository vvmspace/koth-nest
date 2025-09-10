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
    console.log(`🥪 FOOD_SHARE: Starting food sharing process for referrer ${telegramReferrerId}`);
    console.log(`👤 FOOD_SHARE: User who triggered sharing:`, {
      id: user?.id,
      telegramId: user?.telegramId,
      name: user?.name,
      telegramUsername: user?.telegramUsername
    });
    
    const referrer = await this.giveSandwich(telegramReferrerId);
    console.log(`🥪 FOOD_SHARE: Sandwich given to referrer:`, {
      referrerId: referrer.id,
      telegramId: referrer.telegramId,
      name: referrer.name,
      telegramUsername: referrer.telegramUsername,
      newSandwiches: referrer.sandwiches
    });
    
    if (user) {
      const sandwichMessage = `🥪 ${
        user?.name || user?.telegramUsername || user?.telegramId
      } gave you a sandwich!`;
      
      console.log(`📱 FOOD_SHARE: Sending sandwich notification to ${telegramReferrerId}:`, sandwichMessage);
      
      await this.tgService
        .sendTelegramMessage(telegramReferrerId, sandwichMessage)
        .catch((e) => {
          console.error(`❌ FOOD_SHARE: Failed to send sandwich message to ${telegramReferrerId}:`, e.message);
        });
    }
    
    console.log(`☕ FOOD_SHARE: Checking if referrer has their own referrer...`);
    console.log(`🔍 FOOD_SHARE: Referrer's referrer ID: ${referrer.telegramReferrerId}`);
    
    if (
      !referrer.telegramReferrerId ||
      referrer.telegramReferrerId === referrer.telegramId
    ) {
      console.log(`ℹ️ FOOD_SHARE: Referrer ${telegramReferrerId} has no referrer or self-referral, stopping chain`);
      return;
    }
    
    console.log(`☕ FOOD_SHARE: Referrer has referrer ${referrer.telegramReferrerId}, giving coffee...`);
    await this.giveCoffee(referrer.telegramReferrerId);
    console.log(`☕ FOOD_SHARE: Coffee given to referrer's referrer ${referrer.telegramReferrerId}`);
    
    if (user) {
      const coffeeMessage = `☕️ some friend of ${
        referrer?.name || referrer?.telegramUsername || referrer?.telegramId
      } gave you a coffee!`;
      
      console.log(`📱 FOOD_SHARE: Sending coffee notification to ${referrer.telegramReferrerId}:`, coffeeMessage);
      
      await this.tgService.sendTelegramMessage(
        referrer.telegramReferrerId,
        coffeeMessage,
      ).catch((e) => {
        console.error(`❌ FOOD_SHARE: Failed to send coffee message to ${referrer.telegramReferrerId}:`, e.message);
      });
    }
    
    console.log(`✅ FOOD_SHARE: Food sharing process completed for referrer ${telegramReferrerId}`);
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
