import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1772161128722 implements MigrationInterface {
  name = 'Migrations1772161128722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_0a6e2c450d83e0b6052c2793334"`,
    );
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "articles" ADD "authorId" integer`);
    await queryRunner.query(
      `ALTER TABLE "articles" ALTER COLUMN "favorited" TYPE character varying USING (CASE WHEN "favorited" = true THEN 'true' ELSE 'false' END)`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ALTER COLUMN "favorited" SET DEFAULT 'false'`,
    );
    await queryRunner.query(
      `UPDATE "articles" SET "favorited" = 'false' WHERE "favorited" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ALTER COLUMN "favorited" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`,
    );
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "favorited"`);
    await queryRunner.query(
      `ALTER TABLE "articles" ADD "favorited" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "authorId"`);
    await queryRunner.query(`ALTER TABLE "articles" ADD "id" integer`);
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_0a6e2c450d83e0b6052c2793334" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
