import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('publishers')
export class Publisher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
