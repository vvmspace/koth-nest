import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { UsersService } from "./user.service";

@Injectable()
export class UserScheduleService {
    constructor(
        private readonly userService: UsersService,
    ) {}
    @Cron("7 * * * * *")
    async tick() {
        console.log("Tick");
        const user = await this.userService.getReminderUser();
        console.log("User", user);
        await this.userService.remind(user);
        console.log("Reminded", user.telegramId, user.name);
    }
}