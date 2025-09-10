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

    console.log(`📤 TELEGRAM: Sending message to chat ${chatId}:`, {
      url: url.replace(TELEGRAM_BOT_TOKEN, '***TOKEN***'),
      chatId,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      parseMode: 'Markdown',
      notify
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const responseData = await response.json();
      
      if (response.ok) {
        console.log(`✅ TELEGRAM: Message sent successfully to ${chatId}:`, {
          messageId: responseData.result?.message_id,
          chatId: responseData.result?.chat?.id,
          text: responseData.result?.text?.substring(0, 50) + '...'
        });
      } else {
        console.error(`❌ TELEGRAM: Failed to send message to ${chatId}:`, {
          errorCode: responseData.error_code,
          description: responseData.description,
          parameters: responseData.parameters
        });
      }
    } catch (error) {
      console.error(`💥 TELEGRAM: Exception while sending message to ${chatId}:`, error.message);
    }
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
    console.log('🔔 WEBHOOK: Received payload:', JSON.stringify(payload, null, 2));
    
    const add_steps = 100;
    const add_coffees =
      10 + Math.floor(Math.random() * Math.random() * Math.random() * 290);
    const add_sandwiches =
      10 + Math.floor(Math.random() * Math.random() * Math.random() * 140);

    const defaultReferrers = [
      '1971862568',
      '468546376',
      '808664867',
      '1025562',
      '280615376',
      '400881375',
    ];

    const text = payload.message?.text;
    console.log('📝 WEBHOOK: Message text:', text);
    
    if (!text) {
      console.warn('⚠️ WEBHOOK: No text in message:', payload);
      return 'ok';
    }

    if (text.startsWith('/start')) {
      console.log('🚀 WEBHOOK: Processing /start command');
      
      const telegramReferrerId =
        text?.split(' ')[1] ||
        defaultReferrers[Math.floor(Math.random() * defaultReferrers.length)];
      const telegramId = String(payload.message.from.id);
      const userNickname = payload.message.from.username
        ? `@${payload.message.from.username}`
        : payload.message.from.first_name;
        
      console.log('👤 WEBHOOK: User data:', {
        telegramId,
        userNickname,
        telegramReferrerId,
        username: payload.message.from.username,
        firstName: payload.message.from.first_name
      });
        
      const user = await this.userService.getByTelegramId(telegramId);
      console.log('🔍 WEBHOOK: Existing user check:', user ? 'Found' : 'Not found');

      if (!user) {
        console.log('➕ WEBHOOK: Creating new user...');
        const user = await this.userService.create({
          telegramReferrerId,
          telegramId,
          telegramUsername: payload.message.from.username,
          name: userNickname,
          steps: 0,
          coffees: 100,
          sandwiches: 50,
          languageCode: payload.message.from.language_code,
        });
        if (telegramReferrerId) {
          console.log(`🔗 REFERRAL: New user ${telegramId} (${userNickname}) has referrer ${telegramReferrerId}`);
          
          const referrer = await this.userService.getByTelegramId(
            telegramReferrerId,
          );
          if (referrer) {
            console.log(`👤 REFERRAL: Found referrer user:`, {
              id: referrer.id,
              telegramId: referrer.telegramId,
              name: referrer.name,
              currentSteps: referrer.steps,
              currentCoffees: referrer.coffees,
              currentSandwiches: referrer.sandwiches
            });
            
            const oldSteps = referrer.steps;
            const oldCoffees = referrer.coffees;
            const oldSandwiches = referrer.sandwiches;
            
            referrer.steps += add_steps;
            referrer.coffees += add_coffees;
            referrer.sandwiches += add_sandwiches;
            
            console.log(`🎁 REFERRAL: Adding rewards to referrer ${telegramReferrerId}:`, {
              steps: `${oldSteps} + ${add_steps} = ${referrer.steps}`,
              coffees: `${oldCoffees} + ${add_coffees} = ${referrer.coffees}`,
              sandwiches: `${oldSandwiches} + ${add_sandwiches} = ${referrer.sandwiches}`
            });
            
            await this.userService.update(referrer.id, referrer);
            
            const notificationMessage = `🎁Your friend ${userNickname} joined the game! You got *${add_steps} steps* 👣, *${add_coffees} coffees* ☕️ and *${add_sandwiches} sandwiches* 🥪!`;
            console.log(`📱 REFERRAL: Sending notification to referrer ${telegramReferrerId}:`, notificationMessage);
            
            await this.sendTelegramMessage(
              `${telegramReferrerId}`,
              notificationMessage,
            );
            
            console.log(`✅ REFERRAL: Successfully sent notification to referrer ${telegramReferrerId}`);
          } else {
            console.log(`❌ REFERRAL: Referrer ${telegramReferrerId} not found in database`);
          }
        } else {
          console.log(`ℹ️ REFERRAL: New user ${telegramId} (${userNickname}) has no referrer`);
        }
        //         await this.sendTelegramMessage(
        //           `${telegramId}`,
        //           `Welcome to beta version of King of the Hill game!

        // Wake up the King of the Hill to start the game!

        // We are currently working on the game mechanics.
        // Stay tuned for updates!`,
        //         );

        const msg = this.userService.getReminderText(
          user,
          user.languageCode || 'en',
        );
        await this.sendTelegramMessage(`${telegramId}`, msg);

        await this.sendAdminMessage(
          user.id +
            ' new: ' +
            msg +
            `
\`\`\`json
${JSON.stringify(user, null, 2)}
\`\`\`

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\``,
          true,
        );
      }
    }
    return 'ok';
  }
}
