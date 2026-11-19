import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
/** Mapeo del esquema vigente: no añade tablas ni activa sincronización. */
@Entity({ schema: "new_horizons", name: "movimiento_nino" })
export class MovimientoNino {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ name: "estancia_nino_id", type: "bigint" }) estanciaNinoId!: string;
  @Column({ name: "tipo", type: "text" }) tipo!: string;
  @Column({
    name: "fecha",
    type: "timestamptz",
    default: () => "clock_timestamp()",
  })
  fecha!: Date;
  @Column({ name: "destino", type: "text", nullable: true }) destino!:
    string | null;
  @Column({ name: "responsable", type: "text", nullable: true }) responsable!:
    string | null;
  @Column({ name: "registrado_por", type: "bigint" }) registradoPor!: string;
}
