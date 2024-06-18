import { Injectable } from '@nestjs/common';
import { ConfigService } from 'modules/config';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';

export class TGWebhook {
  update_id: number;
  message: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
      language_code: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: string;
    };
    date: number;
    text: string;
    entities: any[];
  };
}

@Injectable()
export class TGService {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
  ) {}

  async sendTelegramMessage(chatId: string, text: string) {
    const TELEGRAM_BOT_TOKEN = this.configService.get('TELEGRAM_BOT_TOKEN');
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  }

  async sendAdminMessage(data: unknown) {
    const TELEGRAM_ADMIN_CHAT_ID = this.configService.get(
      'TELEGRAM_ADMIN_CHAT_ID',
    );
    if (!TELEGRAM_ADMIN_CHAT_ID) {
      console.log(data);
      return;
    }
    const text =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await this.sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, text);
  }

  async webhook(payload: TGWebhook) {
    const text = payload.message.text;
    if (text.startsWith('/start')) {
      const telegramReferrerId = +text.split(' ')[1];
      const telegramId = payload.message.from.id;
      const userNickname = payload.message.from.username
        ? `@${payload.message.from.username}`
        : payload.message.from.first_name;
      const user = await this.userService.getByTelegramId(telegramId);

      if (!user) {
        await this.userService.create({
          telegramReferrerId,
          telegramId,
          telegramUsername: payload.message.from.username,
          name: userNickname,
          steps: 0,
          coffees: 5,
          sandwiches: 2,
        });
        await this.sendTelegramMessage(
          telegramReferrerId.toString(),
          `Your friend ${userNickname} joined the game!`,
        );
        await this.sendTelegramMessage(
          telegramId.toString(),
          'Welcome to the game!',
        );
        await this.sendAdminMessage(`New user: ${userNickname}`);
      }
    }
    return 'ok';
  }
}
