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
  @Column({ name: "tipo_vivienda", type: "text", nullable: true }) tipoVivienda!: string | null;
  @Column({ name: "composicion_familiar", type: "text", nullable: true }) composicionFamiliar!: string | null;
  @Column({ name: "redes_apoyo", type: "text", nullable: true }) redesApoyo!: string | null;
  @Column({ name: "dependencia_economica", type: "boolean", nullable: true }) dependenciaEconomica!: boolean | null;
  @Column({ name: "responsable_plan", type: "text", nullable: true }) responsablePlan!: string | null;
  @Column({ name: "fecha_revision", type: "date", nullable: true }) fechaRevision!: string | null;
  @Column({ name: "area_coordinacion_id", type: "bigint", nullable: true }) areaCoordinacionId!: string | null;
  @Column({ name: "resultados_alcanzados", type: "text", nullable: true }) resultadosAlcanzados!: string | null;
  @Column({ name: "fecha_cierre", type: "date", nullable: true }) fechaCierre!: string | null;
  @Column({ name: "observaciones", type: "text", nullable: true }) observaciones!: string | null;
}
