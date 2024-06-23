import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'modules/common/decorator/current-user.decorator';
import { User } from 'modules/user';
import { AwakeService } from './awake.service';

@Controller('api/awake')
export class AwakeController {
  constructor(private awakeService: AwakeService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async awake(@CurrentUser() user: Partial<User>) {
    console.log(
      'api/awake',
      user.telegramId,
      user.lastAwake,
      user.steps,
      user.name,
    );
    return this.awakeService.awake(user);
  }
}
