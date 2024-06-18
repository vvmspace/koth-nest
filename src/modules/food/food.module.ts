import { Module } from '@nestjs/common';
import { UserModule } from 'modules/user/user.module';
import { FoodService } from './food.service';
import { FoodController } from './food.contoller';

@Module({
  imports: [UserModule],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
