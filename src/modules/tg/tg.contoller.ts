import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TGService, TGWebhook } from './tg.service';

// webhook {
//     update_id: 426055786,
//     message: {
//       message_id: 135,
//       from: {
//         id: 280615376,
//         is_bot: false,
//         first_name: 'Vladimir',
//         username: 'vvmspace',
//         language_code: 'en'
//       },
//       chat: {
//         id: 280615376,
//         first_name: 'Vladimir',
//         username: 'vvmspace',
//         type: 'private'
//       },
//       date: 1718701329,
//       text: '/start 280615376',
//       entities: [ [Object] ]
//     }
//   }

@Controller('api/tg')
export class TGController {
  constructor(private tgService: TGService) {}

  @Post('webhook')
  async webhook(@Body() payload: TGWebhook) {
    return this.tgService.webhook(payload);
  }
}
