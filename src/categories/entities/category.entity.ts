import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, (item) => item.children, { nullable: true })
  parent: Category | null;

  @OneToMany(() => Category, (item) => item.parent)
  children: Category[];
}
