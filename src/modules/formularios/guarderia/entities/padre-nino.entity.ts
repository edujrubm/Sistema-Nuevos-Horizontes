import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type TipoVinculoPadre = "BIOLOGICO" | "LEGAL";

/** Identidad declarada por niño; independiente de agresores y permisos de traslado. */
@Entity({ schema: "new_horizons", name: "padre_nino" })
export class PadreNinoEntity {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ name: "nino_id", type: "bigint" }) ninoId!: string;
  @Column({ name: "tipo_vinculo", type: "text" })
  tipoVinculo!: TipoVinculoPadre;
  @Column({ type: "text", nullable: true }) nombre!: string | null;
  @Column({ type: "text", nullable: true }) cui!: string | null;
  @Column({ type: "text", nullable: true }) telefono!: string | null;
  @Column({ type: "text", nullable: true }) direccion!: string | null;
  @Column({
    name: "creado_en",
    type: "timestamptz",
    default: () => "clock_timestamp()",
  })
  creadoEn!: Date;
  @Column({
    name: "actualizado_en",
    type: "timestamptz",
    default: () => "clock_timestamp()",
  })
  actualizadoEn!: Date;
  // El trigger compartido prepara la versión; no usar @VersionColumn para duplicarla.
  @Column({ type: "integer", default: 1 }) version!: number;
}
