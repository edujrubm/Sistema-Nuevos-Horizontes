import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({
  name: "usuario",
  schema: "new_horizons",
})
export class Usuario {
  @PrimaryGeneratedColumn({
    name: "id_usuario",
    type: "bigint",
  })
  id_usuario!: string;
  @Column({
    name: "debe_cambiar_contrasena",
    type: "boolean",
    default: false,
  })
  debe_cambiar_contrasena!: boolean;

  @Column({
    name: "nombre_usuario",
    type: "varchar",
    length: 60,
    unique: true,
  })
  nombre_usuario!: string;

  @Column({
    name: "contrasena_hash",
    type: "text",
  })
  contrasena_hash!: string;

  @Column({
    name: "id_empleado",
    type: "bigint",
  })
  id_empleado!: string;

  @Column({
    name: "token_hash",
    type: "text",
    nullable: true,
  })
  token_hash!: string | null;

  @Column({
    name: "activo",
    type: "boolean",
    default: true,
  })
  activo!: boolean;

  @Column({
    name: "desactivado_en",
    type: "timestamptz",
    nullable: true,
  })
  desactivado_en!: Date | null;

  @Column({
    name: "desactivado_por",
    type: "bigint",
    nullable: true,
  })
  desactivado_por!: string | null;
}
