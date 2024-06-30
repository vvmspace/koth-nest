import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from 'modules/config';
import { User } from 'modules/user';
import { UsersService } from 'modules/user/user.service';

export class TGWebhook {
  update_id: number;
  message: {
    message_id: number;
    from: {
      id: string;
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
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private configService: ConfigService,
  ) {}

  async sendTelegramMessage(chatId: string, text: string, notify = true) {
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
        parse_mode: 'Markdown'
      }),
    });
  }

  async sendAdminMessage(data: unknown, notify = false) {
    const TELEGRAM_ADMIN_CHAT_ID = this.configService.get(
      'TELEGRAM_ADMIN_CHAT_ID',
    );
    if (!TELEGRAM_ADMIN_CHAT_ID) {
      return;
    }
    const text =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await this.sendTelegramMessage(TELEGRAM_ADMIN_CHAT_ID, text, notify);
  }

  async webhook(payload: TGWebhook) {
    const add_steps = 100;
    const add_coffees = 10 + Math.floor(Math.random() * Math.random() * Math.random() * 290);
    const add_sandwiches = 10 + Math.floor(Math.random() * Math.random() * Math.random() * 140);
    const text = payload.message?.text;
    if (!text) {
      console.warn(payload);
      return 'ok';
    }
    if (text.startsWith('/start')) {
      const telegramReferrerId = text?.split(' ')[1];
      const telegramId = payload.message.from.id;
      const userNickname = payload.message.from.username
        ? `@${payload.message.from.username}`
        : payload.message.from.first_name;
      const user = await this.userService.getByTelegramId(telegramId);

      if (!user) {
        const user = await this.userService.create({
          telegramReferrerId,
          telegramId,
          telegramUsername: payload.message.from.username,
          name: userNickname,
          steps: 0,
          coffees: 100,
          sandwiches: 50,
        });
        if (telegramReferrerId) {
          const referrer = await this.userService.getByTelegramId(
            telegramReferrerId,
          );
          if (referrer) {
            referrer.steps += add_steps;
            referrer.coffees += add_coffees;
            referrer.sandwiches += add_sandwiches;
            await this.userService.update(referrer.id, referrer);
            await this.sendTelegramMessage(
              `${telegramReferrerId}`,
              `🎁Your friend ${userNickname} joined the game! You got *${add_steps} steps* 👣, *${add_coffees} coffees* ☕️ and *${add_sandwiches} sandwiches* 🥪!`,
            );
          }
        }
//         await this.sendTelegramMessage(
//           `${telegramId}`,
//           `Welcome to beta version of King of the Hill game!

// Wake up the King of the Hill to start the game!

// We are currently working on the game mechanics.
// Stay tuned for updates!`,
//         );

        const msg = this.userService.getReminderText(user, user.languageCode || 'en')
        await this.sendTelegramMessage(
          `${telegramId}`,
          msg,
        )

        await this.sendAdminMessage('new: ' + msg, true);
      }
    }
    return 'ok';
  }
}
