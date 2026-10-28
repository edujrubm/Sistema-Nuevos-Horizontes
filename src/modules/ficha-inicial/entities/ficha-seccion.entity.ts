import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "ficha_inicial_seccion" })
export class FichaSeccionEntity {
  @PrimaryGeneratedColumn({ type: "bigint" }) id!: string;
  @Column({ name: "ficha_inicial_id", type: "bigint" }) fichaInicialId!: string;
  @Column({ type: "varchar" }) seccion!: string;
  @Column({ type: "jsonb" }) contenido!: Record<string, unknown>;
  @Column({ type: "integer" }) version!: number;
  @Column({ name: "actualizado_en", type: "timestamptz" }) actualizadoEn!: Date;
}
