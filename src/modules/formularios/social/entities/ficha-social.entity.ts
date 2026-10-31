import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "ficha_social" })
export class FichaSocial {
  @PrimaryColumn({ name: "formulario_id", type: "bigint" })
  formularioId!: string;
  @Column({ name: "historia_violencia", type: "text", nullable: true })
  historiaViolencia!: string | null;
  @Column({ name: "diagnostico_social", type: "text", nullable: true })
  diagnosticoSocial!: string | null;
  @Column({ name: "riesgos_identificados", type: "text", nullable: true })
  riesgosIdentificados!: string | null;
  @Column({ name: "plan_eliminacion_riesgos", type: "text", nullable: true })
  planEliminacionRiesgos!: string | null;
  @Column({ name: "objetivo_general", type: "text", nullable: true })
  objetivoGeneral!: string | null;
  @Column({ name: "actividades", type: "text", nullable: true }) actividades!:
    string | null;
  @Column({ name: "evaluacion", type: "text", nullable: true }) evaluacion!:
    string | null;
}
