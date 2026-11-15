import { Column, Entity, PrimaryColumn } from "typeorm";

/** Proyección de lectura del esquema vigente; no administra escrituras ni migraciones. */
@Entity({ schema: "new_horizons", name: "entrada_evolutiva" })
export class EntradaEvolutivaLectura {
  @PrimaryColumn({ type: "bigint" }) id!: string;
  @Column({ name: "formulario_id", type: "bigint" }) formularioId!: string;
  @Column({ type: "text" }) accion!: string;
  @Column({ type: "text" }) contenido!: string;
  @Column({ name: "plan_seguimiento", type: "text", nullable: true }) planSeguimiento!: string | null;
  @Column({ type: "text", nullable: true }) resultado!: string | null;
  @Column({ name: "fecha_atencion", type: "timestamptz" }) fechaAtencion!: Date;
  @Column({ name: "profesional_id", type: "bigint" }) profesionalId!: string;
}
