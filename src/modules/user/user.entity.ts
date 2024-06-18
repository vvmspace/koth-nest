import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  telegramId: number;

  @Column({ nullable: true, type: 'bigint'})
  telegramReferrerId: number;

  @Column({ default: 0, type: 'bigint' })
  steps: number;

  @Column({ default: 0, type: 'bigint' })
  coffees: number;

  @Column({ default: 0, type: 'bigint' })
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
