import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/** Responsable autorizado de una ficha; su historia se conserva en revision_registro. */
@Entity({ schema: "new_horizons", name: "guarderia_responsable" })
export class GuarderiaResponsable {
  @PrimaryGeneratedColumn("identity", {
    type: "bigint",
    generatedIdentity: "ALWAYS",
  })
  id!: string;
  @Column({ name: "formulario_id", type: "bigint" }) formularioId!: string;
  @Column({ type: "text" }) nombre!: string;
  @Column({ type: "text" }) cui!: string;
  @Column({ type: "text" }) relacion!: string;
  @Column({ type: "text" }) telefono!: string;
  @Column({ name: "creado_en", type: "timestamptz" }) creadoEn!: Date;
  @Column({ name: "actualizado_en", type: "timestamptz" }) actualizadoEn!: Date;
}
