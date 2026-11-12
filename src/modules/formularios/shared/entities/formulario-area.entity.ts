import { Column, Entity, PrimaryColumn } from "typeorm";

/** Cabecera compartida existente: mapeo de lectura, sin cambios de esquema. */
@Entity({ schema: "new_horizons", name: "formulario_area" })
export class FormularioAreaEntity {
  @PrimaryColumn({ type: "bigint" }) id!: string;
  @Column({ name: "expediente_id", type: "bigint" }) expedienteId!: string;
  @Column({ name: "nino_id", type: "bigint", nullable: true }) ninoId!:
    string | null;
  @Column({ name: "area_id", type: "bigint" }) areaId!: string;
  @Column({ type: "text" }) tipo!: string;
  @Column({ name: "estado_codigo", type: "text" }) estadoCodigo!: string;
  @Column({ name: "fecha_atencion", type: "timestamptz" }) fechaAtencion!: Date;
  @Column({ name: "profesional_id", type: "bigint" }) profesionalId!: string;
  @Column({ name: "capturado_por", type: "bigint" }) capturadoPor!: string;
  @Column({ name: "creado_en", type: "timestamptz" }) creadoEn!: Date;
  @Column({ name: "actualizado_en", type: "timestamptz" }) actualizadoEn!: Date;
  @Column({ type: "integer" }) version!: number;
  @Column({ name: "motivo_cambio", type: "text", nullable: true })
  motivoCambio!: string | null;
  @Column({ name: "identidad_al_atender", type: "jsonb" })
  identidadAlAtender!: Record<string, unknown>;
  @Column({ name: "firma_documento_id", type: "bigint", nullable: true })
  firmaDocumentoId!: string | null;
}
