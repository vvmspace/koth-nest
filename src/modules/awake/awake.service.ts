import { Injectable } from '@nestjs/common';
import { AWAKE_INTERVAL } from 'consants/awake.constants';
import { ConfigService } from 'modules/config';
import { FoodService } from 'modules/food/food.service';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';
import { MissionService } from 'modules/mission/mission.service';

@Injectable()
export class AwakeService {
  constructor(
    private userService: UsersService,
    private foodService: FoodService,
    private configService: ConfigService,
    private missionService: MissionService,
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
        console.log(`👑 AWAKE: User ${user.telegramId} (${user.name}) has referrer ${user.telegramReferrerId}, starting food sharing...`);
        await this.foodService
          .shareFood(user.telegramReferrerId, user)
          .catch((e) => {
            console.error(`❌ AWAKE: Error sharing food for user ${user.telegramId}:`, e.message);
          });
      } else {
        console.log(`ℹ️ AWAKE: User ${user.telegramId} (${user.name}) has no referrer, skipping food sharing`);
      }
      await this.giveBreakfast(user.telegramId);
      
      // Update mission progress
      await this.missionService.updateStreak(user.id, 'daily' as any);
      await this.missionService.updateMissionProgress(user.id, 1, 1); // Daily steps mission
      
      console.log('Awake', user.telegramId, user.name, user.lastAwake, diff);
    }

    return { user, nextAwake };
  }

  async giveBreakfast(telegramId: string) {
    await this.foodService.giveCoffee(telegramId);
    await this.foodService.giveSandwich(telegramId);
  }
}
