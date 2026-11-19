import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
/** Mapeo del esquema vigente: no añade tablas ni activa sincronización. */
@Entity({ schema: "new_horizons", name: "estancia_nino" })
export class EstanciaNino {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ name: "activo_albergue_id", type: "bigint" })
  activoAlbergueId!: string;
  @Column({ name: "nino_id", type: "bigint" }) ninoId!: string;
  @Column({ name: "fecha_ingreso", type: "timestamptz" }) fechaIngreso!: Date;
  @Column({ name: "fecha_egreso", type: "timestamptz", nullable: true })
  fechaEgreso!: Date | null;
  @Column({ name: "registrado_por", type: "bigint" }) registradoPor!: string;
}
