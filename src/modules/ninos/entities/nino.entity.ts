import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "nino" })
export class NinoEntity {
  @PrimaryGeneratedColumn({ name: "nino_id", type: "bigint" })
  id!: string;

  @Column({ name: "expediente_id", type: "bigint" })
  expedienteId!: string;

  @Column({ type: "varchar", nullable: true })
  cui!: string | null;

  @Column({ type: "varchar" })
  nombre!: string;

  @Column({ name: "fecha_nac", type: "date", nullable: true })
  fechaNacimiento!: string | null;

  @Column({ type: "boolean", nullable: true })
  reconocido!: boolean | null;

  @Column({ type: "varchar", nullable: true })
  genero!: string | null;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "inactivado_en", type: "timestamptz", nullable: true })
  inactivadoEn!: Date | null;

  @Column({ name: "motivo_inactivacion", type: "varchar", nullable: true })
  motivoInactivacion!: string | null;

  @Column({ type: "integer" })
  version!: number;

  @Column({ name: "creado_en", type: "timestamptz" })
  creadoEn!: Date;

  @Column({ name: "actualizado_en", type: "timestamptz" })
  actualizadoEn!: Date;
}
