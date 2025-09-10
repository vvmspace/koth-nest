import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum MissionType {
  DAILY = 'daily',
  THREE_DAY_STREAK = 'three_day_streak',
  WEEKLY_STREAK = 'weekly_streak',
  SPECIAL = 'special'
}

export enum MissionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  LOCKED = 'locked'
}

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: MissionType,
    default: MissionType.DAILY
  })
  type: MissionType;

  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.ACTIVE
  })
  status: MissionStatus;

  @Column('json')
  requirements: {
    steps?: number;
    coffees?: number;
    sandwiches?: number;
    streak_days?: number;
    special_condition?: string;
  };

  @Column('json')
  rewards: {
    steps?: number;
    coffees?: number;
    sandwiches?: number;
    special_reward?: string;
  };

  @Column({ default: 0 })
  streak_days: number;

  @Column({ default: 0 })
  max_streak_days: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('user_missions')
export class UserMission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  mission_id: number;

  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.ACTIVE
  })
  status: MissionStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: 0 })
  streak_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Mission)
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;
}






