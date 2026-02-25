import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772012751924 implements MigrationInterface {
    name = 'Migrations1772012751924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "authorId" TO "id"`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_0a6e2c450d83e0b6052c2793334" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_0a6e2c450d83e0b6052c2793334"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "id" TO "authorId"`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
