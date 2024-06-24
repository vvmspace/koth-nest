import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddLastReminder1719215877561
  implements MigrationInterface
{
  name = 'AlterUserAddLastReminder1719215877561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "lastReminder" TIMESTAMP`);
    await queryRunner.query(
      `CREATE INDEX "IDX_LAST_REMINDER" ON "users" ("lastReminder") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_LAST_REMINDER"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastReminder"`);
  }
}
