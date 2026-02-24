import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  username: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  bio: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  image: string | null;
}
