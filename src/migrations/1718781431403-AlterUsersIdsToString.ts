import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUsersIdsToString1718781431403 implements MigrationInterface {
  name = 'AlterUsersIdsToString1718781431403';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telegramId" TYPE character varying USING "telegramId"::character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telegramReferrerId" TYPE character varying USING "telegramReferrerId"::character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telegramReferrerId" TYPE bigint USING "telegramReferrerId"::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "telegramId" TYPE bigint USING "telegramId"::bigint`,
    );
  }
}
