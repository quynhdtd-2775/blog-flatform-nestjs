import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1786947573935 implements MigrationInterface {
    name = 'Migrations1786947573935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'USER', "status" character varying NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "publishers" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_9d73f23749dca512efc3ccbea6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "authors" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "bio" text, CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "total_quantity" integer NOT NULL DEFAULT '0', "available_quantity" integer NOT NULL DEFAULT '0', "author_id" integer, "publisher_id" integer, "category_id" integer, CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "book_id" integer, "user_id" integer, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "borrow_request_books" ("borrow_request_id" integer NOT NULL, "book_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_9f4b54b2d496fbdc7bd2bafc6c2" PRIMARY KEY ("borrow_request_id", "book_id"))`);
        await queryRunner.query(`CREATE TABLE "borrow_requests" ("id" SERIAL NOT NULL, "from_date" date NOT NULL, "to_date" date NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "reject_reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_dd534a057b1e97d763fb193973f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "articles" ("articleId" SERIAL NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "body" character varying NOT NULL, "tagList" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "favorited" character varying NOT NULL DEFAULT 'false', "favoritesCount" integer NOT NULL DEFAULT '0', "authorId" integer, CONSTRAINT "PK_709f0216840494e847a430f57b7" PRIMARY KEY ("articleId"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1123ff6815c5b8fec0ba9fec37" ON "articles" ("slug") `);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "FK_1056dbee4616479f7d562c562df" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "FK_370ec5bbafd46f74b23a20a5298" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "FK_46f5b35b90175a660f99810bc97" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_6eac1eb972072b64c90ec71995d" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "borrow_requests" ADD CONSTRAINT "FK_20461d9cede20634b9281db3a1c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`ALTER TABLE "borrow_requests" DROP CONSTRAINT "FK_20461d9cede20634b9281db3a1c"`);
        await queryRunner.query(`ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf"`);
        await queryRunner.query(`ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_6eac1eb972072b64c90ec71995d"`);
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "FK_46f5b35b90175a660f99810bc97"`);
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "FK_370ec5bbafd46f74b23a20a5298"`);
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "FK_1056dbee4616479f7d562c562df"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1123ff6815c5b8fec0ba9fec37"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "borrow_requests"`);
        await queryRunner.query(`DROP TABLE "borrow_request_books"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "authors"`);
        await queryRunner.query(`DROP TABLE "publishers"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
