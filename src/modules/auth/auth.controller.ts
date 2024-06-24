import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiResponseProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService, JWTResponse, TelegramQuery } from './';
import { CurrentUser } from './../common/decorator/current-user.decorator';
import { User, UsersService } from './../user';
import { Request } from 'express';
import { ConfigService } from 'modules/config';
import { AWAKE_INTERVAL } from 'consants/awake.constants';

@Controller('api/auth')
@ApiTags('authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'User `auth_token`',
    type: JWTResponse,
  })
  async getAuthToken(
    @Req() request: Request,
    @Query() user: TelegramQuery,
  ): Promise<JWTResponse> {
    console.log('Auth attempt');
    const rawQuery = request.url.split('?')[1];
    return this.authService.verifyAndLogin(rawQuery, user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Get('me')
  @ApiResponse({ status: 200, description: 'Successful Response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLoggedInUser(
    @CurrentUser() user: User,
  ): Promise<{ user: User; nextAwake: Date }> {
    const awakeInterval = this.configService.getInt(
      'AWAKE_INTERVAL',
      AWAKE_INTERVAL,
    );
    const nextAwake = user.lastAwake
      ? new Date(user.lastAwake.getTime() + awakeInterval)
      : new Date('2021-01-01');
    return {
      user,
      nextAwake,
    };
  }
}
