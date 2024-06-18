import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'modules/common/decorator/current-user.decorator';
import { User } from 'modules/user';
import { FoodService } from './food.service';

@Controller('api/food')
export class FoodController {
  constructor(private foodService: FoodService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('coffee')
  async useCoffee(@CurrentUser() user: Partial<User>) {
    return this.foodService.useCoffee(user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('sandwich')
  async useSandwich(@CurrentUser() user: Partial<User>) {
    return this.foodService.useSandwich(user);
  }
}
