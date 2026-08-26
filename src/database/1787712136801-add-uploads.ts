import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUploads1787712136801 implements MigrationInterface {
  name = 'AddUploads1787712136801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "comment_images" ("id" SERIAL NOT NULL, "path" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "comment_id" integer, CONSTRAINT "PK_3825085cf9ac268fc653e6e494a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar_path" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "authors" ADD "avatar_path" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD "cover_path" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_images" ADD CONSTRAINT "FK_5f1be7778111c3dcf1fca4284a5" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment_images" DROP CONSTRAINT "FK_5f1be7778111c3dcf1fca4284a5"`,
    );
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "cover_path"`);
    await queryRunner.query(`ALTER TABLE "authors" DROP COLUMN "avatar_path"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_path"`);
    await queryRunner.query(`DROP TABLE "comment_images"`);
  }
}
