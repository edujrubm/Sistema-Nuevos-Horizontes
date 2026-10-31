import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "ficha_inicial" })
export class FichaInicialEntity {
  @PrimaryGeneratedColumn({ name: "id_ficha_inicial", type: "bigint" })
  id!: string;
  @Column({ name: "expediente_id", type: "bigint" }) expedienteId!: string;
  @Column({ name: "correlativo_ficha", type: "varchar", nullable: true })
  correlativo!: string | null;
  @Column({ type: "varchar", nullable: true }) lugar!: string | null;
  @Column({ type: "timestamptz", nullable: true }) fecha!: Date | null;
  @Column({ type: "varchar" }) estado!: "BORRADOR" | "CONFIRMADA";
  @Column({ name: "confirmada_en", type: "timestamptz", nullable: true })
  confirmadaEn!: Date | null;
  @Column({ type: "integer" }) version!: number;
  @Column({ name: "creado_en", type: "timestamptz" }) creadoEn!: Date;
  @Column({ name: "actualizado_en", type: "timestamptz" }) actualizadoEn!: Date;
}
