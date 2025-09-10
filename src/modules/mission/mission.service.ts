import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission, UserMission, MissionType, MissionStatus } from './mission.entity';
import { User } from '../user/user.entity';

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(UserMission)
    private userMissionRepository: Repository<UserMission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserMissions(userId: number): Promise<UserMission[]> {
    return this.userMissionRepository.find({
      where: { user: { id: userId } },
      relations: ['mission'],
    });
  }

  async getAvailableMissions(userId: number): Promise<Mission[]> {
    return this.missionRepository.find({
      where: { is_active: true, status: MissionStatus.ACTIVE },
    });
  }

  async assignMissionToUser(userId: number, missionId: number): Promise<UserMission> {
    const mission = await this.missionRepository.findOne({ where: { id: missionId } });
    if (!mission) {
      throw new Error('Mission not found');
    }

    const existingUserMission = await this.userMissionRepository.findOne({
      where: { user: { id: userId }, mission: { id: missionId } },
    });

    if (existingUserMission) {
      return existingUserMission;
    }

    const userMission = this.userMissionRepository.create({
      user: { id: userId } as User,
      mission: { id: missionId } as Mission,
      progress: 0,
      status: MissionStatus.ACTIVE,
    });

    return this.userMissionRepository.save(userMission);
  }

  async updateMissionProgress(userId: number, missionId: number, progress: number): Promise<UserMission | null> {
    const userMission = await this.userMissionRepository.findOne({
      where: { user: { id: userId }, mission: { id: missionId } },
      relations: ['mission'],
    });

    if (!userMission) {
      console.log(`⚠️ User mission not found for user ${userId}, mission ${missionId}`);
      return null;
    }

    userMission.progress = progress;
    
    // Check if mission is completed
    if (progress >= userMission.mission.requirements.steps) {
      userMission.status = MissionStatus.COMPLETED;
      userMission.completed_at = new Date();
      
      // Give rewards
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        if (userMission.mission.rewards.steps) {
          user.steps += userMission.mission.rewards.steps;
        }
        if (userMission.mission.rewards.coffees) {
          user.coffees += userMission.mission.rewards.coffees;
        }
        if (userMission.mission.rewards.sandwiches) {
          user.sandwiches += userMission.mission.rewards.sandwiches;
        }
        await this.userRepository.save(user);
      }
    }

    return this.userMissionRepository.save(userMission);
  }

  async updateStreak(userId: number, type: MissionType): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Update daily streak
    if (type === MissionType.DAILY) {
      if (!user.lastDailyStreak || user.lastDailyStreak < today) {
        user.dailyStreak = (user.dailyStreak || 0) + 1;
        user.lastDailyStreak = today;
        await this.userRepository.save(user);
      }
    }
  }

  async createDefaultMissions(): Promise<void> {
    const existingMissions = await this.missionRepository.count();
    if (existingMissions > 0) return;

    const defaultMissions = [
      {
        title: 'Daily Steps',
        description: 'Make 10 steps by waking up the King',
        type: MissionType.DAILY,
        requirements: { steps: 10 },
        rewards: { steps: 5 },
        is_active: true,
      },
      {
        title: 'Coffee Lover',
        description: 'Drink 3 coffees',
        type: MissionType.DAILY,
        requirements: { coffees: 3 },
        rewards: { coffees: 1 },
        is_active: true,
      },
      {
        title: 'Sandwich Master',
        description: 'Eat 2 sandwiches',
        type: MissionType.DAILY,
        requirements: { sandwiches: 2 },
        rewards: { sandwiches: 1 },
        is_active: true,
      },
    ];

    for (const missionData of defaultMissions) {
      const mission = this.missionRepository.create(missionData);
      await this.missionRepository.save(mission);
    }
  }
}