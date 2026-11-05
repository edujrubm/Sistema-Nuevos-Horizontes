import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "expediente" })
export class ExpedienteEntity {
  @PrimaryGeneratedColumn({ name: "id_expediente", type: "bigint" })
  id!: string;

  @Column({ name: "beneficiaria_id", type: "bigint", unique: true })
  beneficiariaId!: string;

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "inactivado_en", type: "timestamptz", nullable: true })
  inactivadoEn!: Date | null;

  @Column({
    name: "motivo_inactivacion",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  motivoInactivacion!: string | null;

  @Column({ type: "integer", default: 1 })
  version!: number;
}
