import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameNullable1771924927171 implements MigrationInterface {
  name = 'AddUsernameNullable1771924927171';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "username" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "image" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
  }
}
