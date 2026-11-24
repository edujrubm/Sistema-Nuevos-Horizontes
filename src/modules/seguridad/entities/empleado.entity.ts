import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({
  name: "empleado",
  schema: "new_horizons",
})
export class Empleado {
  @PrimaryGeneratedColumn({
    name: "id_empleado",
    type: "bigint",
  })
  id_empleado!: string;

  @Column({
    name: "nombre",
    type: "varchar",
    length: 60,
  })
  nombre!: string;

  @Column({
    name: "cui",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cui!: string | null;

  @Column({
    name: "supervisor",
    type: "bigint",
    nullable: true,
  })
  supervisor!: string | null;

  @Column({
    name: "rol_id",
    type: "bigint",
    nullable: true,
  })
  rol_id!: string | null;
}
