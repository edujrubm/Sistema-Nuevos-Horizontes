import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
/** Mapeo del esquema vigente: no añade tablas ni activa sincronización. */
@Entity({ schema: "new_horizons", name: "evento_albergue" })
export class EventoAlbergue {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ name: "estancia_id", type: "bigint" }) estanciaId!: string;
  @Column({ name: "tipo", type: "text" }) tipo!: string;
  @Column({
    name: "fecha",
    type: "timestamptz",
    default: () => "clock_timestamp()",
  })
  fecha!: Date;
  @Column({ name: "registrado_por", type: "bigint" }) registradoPor!: string;
  @Column({ name: "motivo", type: "text" }) motivo!: string;
  @Column({ name: "movimiento_id", type: "bigint", nullable: true })
  movimientoId!: string | null;
  @Column({ name: "nino_id", type: "bigint", nullable: true }) ninoId!:
    string | null;
}
