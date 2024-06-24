import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from 'modules/user/user.module';
import { TGService } from './tg.service';
import { TGController } from './tg.contoller';
import { ConfigModule } from 'modules/config';

@Module({
  imports: [forwardRef(() => UserModule), ConfigModule],
  controllers: [TGController],
  providers: [TGService],
  exports: [TGService],
})
export class TGModule {}
