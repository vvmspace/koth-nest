import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_TELEGRAM_ID')
  @Column()
  telegramId: string;

  @Index('IDX_TELEGRAM_REFERRER_ID')
  @Column({ nullable: true })
  telegramReferrerId: string;

  @Index('IDX_STEPS')
  @Column({ default: 0 })
  steps: number;

  @Column({ default: 0 })
  coffees: number;

  @Column({ default: 0 })
  sandwiches: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  telegramUsername: string;

  @Column({ nullable: true })
  lastAwake: Date;

  @Column({ nullable: true })
  lastBonus: Date;

  @Column({ nullable: true })
  languageCode: string;
}
