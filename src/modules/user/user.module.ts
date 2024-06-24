import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { TGModule } from 'modules/tg/tg.module';
import { UserScheduleService } from './user.shedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), forwardRef(() => TGModule)
  ],
  exports: [UsersService],
  providers: [UsersService, UserScheduleService],
  controllers: [UsersController],
})
export class UserModule {}
