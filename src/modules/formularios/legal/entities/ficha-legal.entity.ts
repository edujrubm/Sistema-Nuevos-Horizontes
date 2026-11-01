import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "ficha_legal" })
export class FichaLegal {
  @PrimaryColumn({ name: "formulario_id", type: "bigint" })
  formularioId!: string;
  @Column({ name: "demandado_agresor_id", type: "bigint", nullable: true })
  demandadoAgresorId!: string | null;
  @Column({ name: "demandado_nombre_declarado", type: "text", nullable: true })
  demandadoNombreDeclarado!: string | null;
  @Column({ name: "diagnostico_juridico", type: "text", nullable: true })
  diagnosticoJuridico!: string | null;
  @Column({ name: "plan_tratamiento", type: "text", nullable: true })
  planTratamiento!: string | null;
  @Column({ name: "referencia", type: "text", nullable: true }) referencia!:
    string | null;
  @Column({ name: "inicio_proceso_descripcion", type: "text", nullable: true })
  inicioProcesoDescripcion!: string | null;
  @Column({ name: "juzgado", type: "text", nullable: true }) juzgado!:
    string | null;
  @Column({ name: "numero_juicio", type: "text", nullable: true })
  numeroJuicio!: string | null;
  @Column({ name: "juez_oficial", type: "text", nullable: true }) juezOficial!:
    string | null;
  @Column({ name: "diligenciamiento", type: "text", nullable: true })
  diligenciamiento!: string | null;
  @Column({ name: "inicio_proceso_fecha", type: "date", nullable: true })
  inicioProcesoFecha!: string | null;
  @Column({ name: "relacion_partes", type: "text", nullable: true }) relacionPartes!: string | null;
  @Column({ name: "normativa_aplicable", type: "text", nullable: true }) normativaAplicable!: string | null;
  @Column({ name: "objetivo_legal", type: "text", nullable: true }) objetivoLegal!: string | null;
  @Column({ name: "tipo_juicio", type: "text", nullable: true }) tipoJuicio!: string | null;
  @Column({ name: "estado_proceso", type: "text", nullable: true }) estadoProceso!: string | null;
  @Column({ name: "proxima_actuacion_fecha", type: "date", nullable: true }) proximaActuacionFecha!: string | null;
  @Column({ name: "actuaciones_realizadas", type: "text", nullable: true }) actuacionesRealizadas!: string | null;
  @Column({ name: "acuerdos_proximos_pasos", type: "text", nullable: true }) acuerdosProximosPasos!: string | null;
  @Column({ name: "observaciones", type: "text", nullable: true }) observaciones!: string | null;
}
