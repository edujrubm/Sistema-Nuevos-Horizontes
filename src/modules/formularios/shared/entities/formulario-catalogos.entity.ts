import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "area" })
export class AreaFormularioEntity {
  @PrimaryColumn({ name: "id_area", type: "bigint" }) id!: string;
  @Column({ name: "nombre_area", type: "varchar", length: 60, nullable: true })
  nombre!: string | null;
}

@Entity({ schema: "new_horizons", name: "estado_formulario" })
export class EstadoFormularioEntity {
  @PrimaryColumn({ type: "text" }) codigo!: string;
}

@Entity({ schema: "new_horizons", name: "empleado" })
export class ProfesionalFormularioEntity {
  @PrimaryColumn({ name: "id_empleado", type: "bigint" }) id!: string;
  @Column({ type: "varchar", length: 60 }) nombre!: string;
}
