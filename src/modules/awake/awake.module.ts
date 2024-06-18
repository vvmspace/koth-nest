import { Module } from '@nestjs/common';
import { UserModule } from 'modules/user/user.module';
import { AwakeService } from './awake.service';
import { AwakeController } from './awake.contoller';
import { FoodModule } from 'modules/food/food.module';
import { ConfigModule } from 'modules/config';

@Module({
  imports: [UserModule, FoodModule, ConfigModule],
  controllers: [AwakeController],
  providers: [AwakeService],
})
export class AwakeModule {}
