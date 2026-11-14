import { Entity, PrimaryColumn } from "typeorm";

/** Mapeos mínimos de catálogos existentes; no definen ni crean opciones. */
@Entity({ schema: "new_horizons", name: "etnia" })
export class EtniaGuarderia {
  @PrimaryColumn({ name: "etnia_id", type: "bigint" }) id!: string;
}

@Entity({ schema: "new_horizons", name: "nivel_estudio" })
export class EscolaridadGuarderia {
  @PrimaryColumn({ name: "nivel_estudio_id", type: "bigint" }) id!: string;
}
