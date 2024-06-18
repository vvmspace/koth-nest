import { MigrationInterface, QueryRunner } from 'typeorm';

export class TelegramUser1718689717119 implements MigrationInterface {
  name = 'TelegramUser1718689717119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "telegramId" integer NOT NULL, "telegramReferrerId" integer, "steps" integer NOT NULL DEFAULT '0', "coffees" integer NOT NULL DEFAULT '0', "sandwiches" integer NOT NULL DEFAULT '0', "name" character varying, "telegramUsername" character varying, "lastAwake" TIMESTAMP, "languageCode" character varying, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
