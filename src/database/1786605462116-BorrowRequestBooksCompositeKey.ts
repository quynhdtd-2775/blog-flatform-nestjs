import { MigrationInterface, QueryRunner } from 'typeorm';

export class BorrowRequestBooksCompositeKey1786605462116 implements MigrationInterface {
  name = 'BorrowRequestBooksCompositeKey1786605462116';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "PK_3b7459fff43c0f0803fd9510d54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP COLUMN "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "PK_9f4b54b2d496fbdc7bd2bafc6c2" PRIMARY KEY ("borrow_request_id", "book_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ALTER COLUMN "borrow_request_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ALTER COLUMN "book_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ALTER COLUMN "book_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ALTER COLUMN "borrow_request_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_053f2017adee1b6c9ac2a4870bf" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "FK_4466b7eb014e1f4904bf7e0f3a0" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" DROP CONSTRAINT "PK_9f4b54b2d496fbdc7bd2bafc6c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "borrow_request_books" ADD CONSTRAINT "PK_3b7459fff43c0f0803fd9510d54" PRIMARY KEY ("id")`,
    );
  }
}
