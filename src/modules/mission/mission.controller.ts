import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MissionService } from './mission.service';
import { JwtAuthGuard } from '../auth/jwt-guard';
import { CurrentUser } from '../common/decorator/current-user.decorator';
import { User } from '../user/user.entity';

@Controller('api/missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserMissions(@CurrentUser() user: User) {
    return this.missionService.getUserMissions(user.id);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailableMissions(@CurrentUser() user: User) {
    return this.missionService.getAvailableMissions(user.id);
  }

  @Post(':missionId/assign')
  @UseGuards(JwtAuthGuard)
  async assignMission(
    @CurrentUser() user: User,
    @Param('missionId') missionId: number,
  ) {
    return this.missionService.assignMissionToUser(user.id, missionId);
  }

  @Post(':missionId/complete')
  @UseGuards(JwtAuthGuard)
  async completeMission(
    @CurrentUser() user: User,
    @Param('missionId') missionId: number,
    @Body() body: { progress: number },
  ) {
    return this.missionService.updateMissionProgress(user.id, missionId, body.progress);
  }

  @Post('streak/:type')
  @UseGuards(JwtAuthGuard)
  async updateStreak(
    @CurrentUser() user: User,
    @Param('type') type: string,
  ) {
    await this.missionService.updateStreak(user.id, type as any);
    return { success: true };
  }

  @Post('init')
  async initializeMissions() {
    await this.missionService.createDefaultMissions();
    return { success: true, message: 'Default missions created' };
  }
}





