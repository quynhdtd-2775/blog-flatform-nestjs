import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLibrarySchema1786092725365 implements MigrationInterface {
  name = 'CreateLibrarySchema1786092725365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "publishers" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_9d73f23749dca512efc3ccbea6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "authors" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "bio" text, CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "total_quantity" integer NOT NULL DEFAULT '0', "available_quantity" integer NOT NULL DEFAULT '0', "author_id" integer, "publisher_id" integer, "category_id" integer, CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "borrow_request_books" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "borrow_request_id" integer, "book_id" integer, CONSTRAINT "PK_3b7459fff43c0f0803fd9510d54" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "borrow_requests" ("id" SERIAL NOT NULL, "from_date" date NOT NULL, "to_date" date NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "reject_reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_dd534a057b1e97d763fb193973f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_1056dbee4616479f7d562c562df" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_370ec5bbafd46f74b23a20a5298" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_46f5b35b90175a660f99810bc97" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_requests" ADD CONSTRAINT "FK_20461d9cede20634b9281db3a1c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "borrow_requests" DROP CONSTRAINT "FK_20461d9cede20634b9281db3a1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_46f5b35b90175a660f99810bc97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_370ec5bbafd46f74b23a20a5298"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_1056dbee4616479f7d562c562df"`,
    );
    await queryRunner.query(`DROP TABLE "borrow_requests"`);
    await queryRunner.query(`DROP TABLE "borrow_request_books"`);
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TABLE "authors"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "publishers"`);
  }
}
