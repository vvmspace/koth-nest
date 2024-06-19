import {MigrationInterface, QueryRunner} from "typeorm";

export class UserIndexes1718778353269 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_TELEGRAM_ID" ON "users" ("telegramId") `);
        await queryRunner.query(`CREATE INDEX "IDX_TELEGRAM_REFERRER_ID" ON "users" ("telegramReferrerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_STEPS" ON "users" ("steps") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_TELEGRAM_ID"`);
        await queryRunner.query(`DROP INDEX "IDX_TELEGRAM_REFERRER_ID"`);
        await queryRunner.query(`DROP INDEX "IDX_STEPS"`);
    }

}
