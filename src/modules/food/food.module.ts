import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from 'modules/user/user.module';
import { FoodService } from './food.service';
import { FoodController } from './food.contoller';
import { TGModule } from 'modules/tg/tg.module';

@Module({
  imports: [UserModule, forwardRef(() => TGModule)],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
