import { Controller, Get } from '@nestjs/common';
import { UsersService } from './user.service';

@Controller('api/user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  //deprecated
  @Get()
  async top_old() {
    return this.usersService.top();
  }

  @Get('top')
  async top() {
    return this.usersService.top();
  }

  @Get('count')
  async count() {
    return this.usersService.count();
  }

  @Get('count/active')
  async countActive() {
    return this.usersService.countActive();
  }
}
