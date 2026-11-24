import { Column, Entity, PrimaryColumn } from "typeorm";
/** Catálogo existente, consultado sin alterar el esquema. */
@Entity({ schema: "new_horizons", name: "estado_albergue" })
export class EstadoAlbergue {
  @PrimaryColumn({ name: "estado_albergue_id", type: "bigint" }) id!: string;
  @Column({ type: "varchar", nullable: true }) nombre!: string | null;
}
