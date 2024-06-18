import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { Hash } from '../../utils/Hash';
import { ConfigService } from './../config';
import { User, UsersService } from './../user';
import { ApiResponseProperty } from '@nestjs/swagger';

export class JWTResponse {
  @ApiResponseProperty()
  expiresIn: string;
  @ApiResponseProperty()
  accessToken: string;
  @ApiResponseProperty({
    type: User,
  })
  user: User;
}
// http://localhost:3000/api/auth?query_id=AAHQ2bkQAAAAANDZuRCMNB6V&user=%7B%22id%22%3A280615376%2C%22first_name%22%3A%22Vladimir%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22vvmspace%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1718579839&hash=342cff5625ef8a115b8e21cd4c6d13b7ab3050b2d14c51a9bedc2e2d0e3e600d
export class TelegramQuery {
  query_id: string;
  user: string;
  auth_date: string;
  hash: string;
}

export class TelegramUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  allows_write_to_pm: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  async verifyAndLogin(
    rawQuery: string,
    query: TelegramQuery,
  ): Promise<JWTResponse> {
    const isValid = await this.verifyTelegramData(rawQuery);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    const telegramUser = JSON.parse(query.user) as TelegramUser;

    console.log(query);

    const user = await this.userService.getByTelegramId(telegramUser.id);

    console.log(user);
    if (user) {
      const r = await this.createToken(user);
      console.log(r);
      return r;
    }

    const r = await this.createToken(
      await this.userService.create({
        telegramId: telegramUser.id,
        name: telegramUser.first_name,
        telegramUsername: telegramUser.username,
        languageCode: telegramUser.language_code,
      }),
    );

    console.log(r);

    return r;
  }

  async createToken(user: User): Promise<JWTResponse> {
    return {
      expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
      accessToken: this.jwtService.sign({ id: user.id }),
      user,
    };
  }

  // Function to transform initData into an object
  private parseQuery(initData: string): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(initData));
  }

  // Function to generate the check string
  private async generateCheckString(
    data: Record<string, string>,
  ): Promise<string> {
    return Object.keys(data)
      .filter((key) => key !== 'hash')
      .map((key) => `${key}=${data[key]}`)
      .sort()
      .join('\n');
  }

  // Function to compute the HMAC-SHA256 hash
  private async computeHash(
    data: Record<string, string>,
    botToken: string,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const checkString = await this.generateCheckString(data);
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign'],
    );
    const secret = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(botToken),
    );
    const signatureKey = await crypto.subtle.importKey(
      'raw',
      secret,
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign'],
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      signatureKey,
      encoder.encode(checkString),
    );

    const hex = [...new Uint8Array(signature)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return hex;
  }

  // Function to verify Telegram data
  async verifyTelegramData(rawQuery: string): Promise<boolean> {
    const data = this.parseQuery(rawQuery);
    const hash = data.hash || '';
    const computedHash = await this.computeHash(
      data,
      this.configService.get('TELEGRAM_BOT_TOKEN'),
    );
    return computedHash === hash;
  }
}
