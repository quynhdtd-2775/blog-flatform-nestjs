import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772161666782 implements MigrationInterface {
    name = 'Migrations1772161666782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "favorited" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "favorited" DROP DEFAULT`);
    }

}
