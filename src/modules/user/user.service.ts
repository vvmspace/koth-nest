import {
  Inject,
  Injectable,
  NotAcceptableException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';

import { User } from './user.entity';
import { TGService } from 'modules/tg/tg.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => TGService))
    private readonly tgService: TGService,
  ) {}

  async get(id: number) {
    return this.userRepository.findOne({ id });
  }

  async getByTelegramId(telegramId: string) {
    return await this.userRepository.findOne({ telegramId });
  }

  async create(payload: Partial<User>) {
    const user = await this.getByTelegramId(payload.telegramId);

    if (user) {
      throw new NotAcceptableException(
        'User with provided telegramId already created.',
      );
    }

    return await this.userRepository.save(payload);
  }

  async update(id: number, payload: Partial<User>) {
    await this.userRepository.update(id, payload);
    return this.get(id);
  }

  getReminderText(user: Partial<User>, lang = 'en') {
    const texts = {
      en: `🎁 *Hey ${user.name}! Don't forget to take your daily bonus!* 🎁

We greatly appreciate your engagement and continue to brainstorm and develop the future of the game.

✅ *We’re currently working on:*
- Codebase Overhaul: We are aware of the UI issues and are working on a new version. Fixing and modifying the current version aims to make the new version more user-friendly for both developers and users.
- Multilingual Support: We've noticed an influx of users from South America, as well as players from France and Poland. This is just the first step—more to come!
- Backend and Game Mechanics: Let’s be honest, the user interface is not the most important aspect at this early stage, as there are many other options to explore. We’ll maintain a minimalist approach to balance user accessibility and development pace.
- Scalability: To better understand the game mechanics and identify strengths and weaknesses, we need a moderate number of active users. We're launching a referral campaign until July 7. (Bring a friend for a bonus! Details coming soon.)

⏳*Looking ahead:*
- Monetization: We plan to introduce several features that will maintain game balance. We’ll be rewarding the most active users with progress-sharing opportunities!
- Our goal is to make user activity beneficial for society.

*Our project is more than just a game!*



🎁 *Guaranteed Bonus for Inviting Friends until July 7, 2024:*
- Share the link with a friend: https://t.me/KingOfTheHillGameBot?start=${user.telegramId}
- And receive *100 guaranteed steps 👣*, plus a random bonus like a magical amount of coffee ☕️ and sandwiches 🥪 that you’ll surely enjoy!
- To maximize your rewards, share links in themed chats and groups! 🚀`,
      es: `🎁 *¡Hola ${user.name}! ¡No olvides reclamar tu bono diario!* 🎁
Valoramos muchísimo tu participación y seguimos pensando y desarrollando el futuro del juego.

✅ *En qué estamos trabajando:*
- Reestructuración del código: Sabemos sobre el problema con la interfaz de usuario, y estamos trabajando en una nueva versión. Las correcciones y modificaciones de la versión actual están orientadas a que la nueva versión sea más amigable tanto para desarrolladores como para usuarios.
- Soporte multilingüe: Hemos notado un aumento de usuarios de Sudamérica, así como jugadores de Francia y Polonia. Este es solo el primer paso, ¡habrá más!
- Backend y mecánicas del juego: Seamos sinceros, la interfaz de usuario no es lo más importante en esta etapa inicial, ya que hay muchas otras opciones por explorar. Mantendremos un enfoque minimalista para equilibrar la accesibilidad del juego y el ritmo de desarrollo.
- Escalabilidad: Para comprender mejor las mecánicas del juego y detectar fortalezas y debilidades, necesitamos un número moderado de usuarios activos. Estamos lanzando una campaña de referidos hasta el 7 de julio. (¡Trae un amigo y obtén un bono! Detalles pronto).

⏳ *A futuro:*
- Monetización: Queremos introducir varias funciones que mantendrán el equilibrio del juego. ¡En el futuro, compartiremos el progreso del juego con los usuarios más activos!
- Nuestro objetivo es que la actividad de los usuarios sea beneficiosa para la sociedad.

*¡Nuestro proyecto es más que un juego!*

🎁 *Bono garantizado por invitar amigos hasta el 7 de julio de 2024:*
- *Envía el enlace a un amigo:* https://t.me/KingOfTheHillGameBot?start=${user.telegramId}
- Y recibe *100 pasos 👣 garantizados*, además de un bono aleatorio, como una cantidad mágica de café ☕️ y sándwiches 🥪 que seguro te encantarán.
- ¡Para aumentar la efectividad, compartí los enlaces en chats y grupos temáticos!`,
    };

    const msg = texts[lang] || texts['en'];
    console.log('Reminder text:', msg);
    return msg;
  }

  async count() {
    return this.userRepository.count();
  }

  // lastAwake or lastBonus is not null and more than 24 hours ago
  async countActive() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const thresholdDate = new Date(Date.now() - ONE_DAY);

    return this.userRepository.count({
      where: [
        {
          lastAwake: MoreThan(thresholdDate),
          lastBonus: IsNull(),
        },
        {
          lastAwake: IsNull(),
          lastBonus: MoreThan(thresholdDate),
        },
        {
          lastAwake: MoreThan(thresholdDate),
          lastBonus: MoreThan(thresholdDate),
        },
      ],
    });
  }

  async top() {
    return this.userRepository.createQueryBuilder('user')
      .where('user.telegramUsername IS NULL OR user.telegramUsername != :value', { value: 'vvmspace' })
      .orderBy('user.steps', 'DESC')
      .take(10)
      .getMany();
  }
  

  async getReminderUser() {
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const lastBonusDate = new Date(Date.now() - ONE_DAY);
    const lastReminderDate = new Date(Date.now() - ONE_DAY);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.lastBonus is null OR user.lastBonus < :lastBonusDate) and (user.lastReminder is null OR user.lastReminder < :lastReminderDate)',
        { lastBonusDate, lastReminderDate },
      )
      .orderBy('user.lastReminder', 'ASC')
      .limit(1)
      .getMany();

    return result.length > 0 ? result[0] : null;
  }

  async remind(user: User) {
    if (!user) {
      return;
    }

    // could be null
    const diffDays = user.lastBonus
      ? (new Date().getTime() - user.lastBonus.getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

    const diffHours = Math.floor(diffDays - Math.floor(diffDays)) * 24;

    user.lastReminder = new Date();
    await this.update(user.id, user);

    await this.tgService.sendTelegramMessage(
      user.telegramId,
      this.getReminderText(user, user.languageCode || 'en'),
    );

    if (diffDays == 0) {
      return;
    }

    await this.tgService.sendAdminMessage(
      `Reminded ${user.telegramUsername || user.name || user.telegramId} [${
        user.languageCode
      }] in ${Math.floor(diffDays)} days ${diffHours} hours.`,
    );
  }
}
