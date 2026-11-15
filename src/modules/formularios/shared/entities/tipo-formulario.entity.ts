import { Column, Entity, PrimaryColumn } from "typeorm";

/** Catálogo aprobado; este mapeo no crea ni modifica sus valores. */
@Entity({ schema: "new_horizons", name: "tipo_formulario" })
export class TipoFormularioEntity {
  @PrimaryColumn({ type: "text" }) codigo!: string;
  @Column({ name: "area_id", type: "bigint" }) areaId!: string;
}
