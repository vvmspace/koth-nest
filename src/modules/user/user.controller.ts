import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./user.service";

@Controller('api/user')
export class UsersController {
    constructor(
        private usersService: UsersService,
    ) {}

    @Get()
    async top() {
        return this.usersService.top();
    }

}