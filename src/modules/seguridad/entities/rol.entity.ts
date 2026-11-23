import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({
  name: "rol",
  schema: "new_horizons",
})
export class Rol {
  @PrimaryGeneratedColumn({
    name: "id_rol",
    type: "bigint",
  })
  id_rol!: string;

  @Column({
    name: "tipo_rol",
    type: "varchar",
    length: 60,
    nullable: true,
  })
  tipo_rol!: string | null;

  @Column({
    name: "descripcion",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  descripcion!: string | null;

  @Column({
    name: "id_area",
    type: "bigint",
    nullable: true,
  })
  id_area!: string | null;
}
