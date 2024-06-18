import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telegramId: number;

  @Column({ nullable: true })
  telegramReferrerId: number;

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
  languageCode: string;
}
