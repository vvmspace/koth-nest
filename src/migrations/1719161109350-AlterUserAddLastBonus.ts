import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddLastBonus1719161109350 implements MigrationInterface {
  name = 'AlterUserAddLastBonus1719161109350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "lastBonus" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastBonus"`);
  }
}
