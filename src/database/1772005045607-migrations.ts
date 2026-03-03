import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1772005045607 implements MigrationInterface {
  name = 'Migrations1772005045607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "articles" ("articleId" SERIAL NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "body" character varying NOT NULL, "tagList" text, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "favorited" boolean NOT NULL, "favoritesCount" integer NOT NULL, "authorId" integer, CONSTRAINT "PK_709f0216840494e847a430f57b7" PRIMARY KEY ("articleId"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1123ff6815c5b8fec0ba9fec37" ON "articles" ("slug") `,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1123ff6815c5b8fec0ba9fec37"`,
    );
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
