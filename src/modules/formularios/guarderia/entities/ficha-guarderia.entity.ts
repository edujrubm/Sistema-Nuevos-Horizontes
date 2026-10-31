import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "ficha_guarderia" })
export class FichaGuarderia {
  @PrimaryColumn({ name: "formulario_id", type: "bigint" })
  formularioId!: string;
  @Column({ name: "numero_ficha", type: "text", nullable: true }) numeroFicha!:
    string | null;
  @Column({ name: "fecha_ingreso", type: "date", nullable: true })
  fechaIngreso!: string | null;
  @Column({ name: "etnia_id", type: "bigint", nullable: true }) etniaId!:
    string | null;
  @Column({ name: "situacion_socioeconomica", type: "text", nullable: true })
  situacionSocioeconomica!: string | null;
  @Column({ name: "condicion_vivienda", type: "text", nullable: true })
  condicionVivienda!: string | null;
  @Column({ name: "lugar_estudio", type: "text", nullable: true })
  lugarEstudio!: string | null;
  @Column({ name: "telefono_escuela", type: "text", nullable: true })
  telefonoEscuela!: string | null;
  @Column({ name: "enfermedad_detalle", type: "text", nullable: true })
  enfermedadDetalle!: string | null;
  @Column({ name: "tratamiento", type: "text", nullable: true }) tratamiento!:
    string | null;
  @Column({ name: "observaciones", type: "text", nullable: true })
  observaciones!: string | null;
  @Column({ name: "padece_enfermedad", type: "boolean", nullable: true })
  padeceEnfermedad!: boolean | null;
  @Column({ name: "escolaridad_id", type: "bigint", nullable: true })
  escolaridadId!: string | null;
}
