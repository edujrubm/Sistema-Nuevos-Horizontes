import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/** Mapeo del esquema documental vigente; no sincroniza ni modifica tablas. */
@Entity({ schema: "new_horizons", name: "documento_area" })
export class DocumentoArea {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ type: "bigint" }) formulario_id!: string;
  @Column({ type: "text" }) categoria!: string;
  @Column({ type: "text" }) objeto_privado!: string;
  @Column({ type: "text" }) mime!: string;
  @Column({ type: "bigint" }) tamano_bytes!: string;
  @Column({ type: "text" }) sha256!: string;
  @Column({ type: "integer" }) version_documento!: number;
  @Column({ type: "bigint", nullable: true }) documento_anterior_id!:
    string | null;
  @Column({ type: "bigint" }) cargado_por!: string;
  @Column({ type: "timestamptz", default: () => "clock_timestamp()" })
  cargado_en!: Date;
  @Column({ type: "timestamptz", nullable: true }) anulado_en!: Date | null;
  @Column({ type: "bigint", nullable: true }) anulado_por!: string | null;
  @Column({ type: "text", nullable: true }) motivo_anulacion!: string | null;
  @Column({ type: "date", nullable: true }) fecha_documento!: string | null;
  @Column({ type: "text", nullable: true }) descripcion!: string | null;
  @Column({ type: "text", nullable: true }) nombre_documento!: string | null;
  @Column({ type: "text", default: "BORRADOR" })
  estado_revision_codigo!: string;
  @Column({ type: "bigint", nullable: true }) revisado_por!: string | null;
  @Column({ type: "timestamptz", nullable: true }) revisado_en!: Date | null;
  @Column({ type: "integer", default: 1 }) version_registro!: number;
}
