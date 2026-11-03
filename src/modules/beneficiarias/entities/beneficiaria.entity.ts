import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "beneficiaria" })
export class BeneficiariaEntity {
  @PrimaryGeneratedColumn({ name: "id_beneficiaria", type: "bigint" })
  id!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  cui!: string | null;

  @Column({ type: "varchar", length: 60 })
  nombre!: string;

  @Column({ name: "fecha_nac", type: "date", nullable: true })
  fechaNacimiento!: string | null;

  @Column({ type: "boolean", nullable: true })
  alfabetismo!: boolean | null;

  @Column({ name: "enfermedad_permanente", type: "boolean", nullable: true })
  enfermedadPermanente!: boolean | null;

  @Column({
    name: "nombre_enfermedad",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  nombreEnfermedad!: string | null;

  @Column({
    name: "tipo_tratamiento",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  tipoTratamiento!: string | null;

  @Column({
    name: "otros_padecimientos",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  otrosPadecimientos!: string | null;

  @Column({ name: "pais_cui_id", type: "bigint", nullable: true })
  paisCuiId!: string | null;

  @Column({ name: "tipo_acompanante_id", type: "bigint", nullable: true })
  tipoAcompananteId!: string | null;

  @Column({ name: "lugar_ocupacion_id", type: "bigint", nullable: true })
  lugarOcupacionId!: string | null;

  @Column({ name: "estado_civil_id", type: "bigint", nullable: true })
  estadoCivilId!: string | null;

  @Column({ name: "ocupacion_id", type: "bigint", nullable: true })
  ocupacionId!: string | null;

  @Column({ name: "nivel_estudio_id", type: "bigint", nullable: true })
  nivelEstudioId!: string | null;

  @Column({ name: "residencia_id", type: "bigint", nullable: true })
  residenciaId!: string | null;

  @Column({ name: "pais_origen_id", type: "bigint", nullable: true })
  paisOrigenId!: string | null;

  @Column({ name: "departamento_origen_id", type: "bigint", nullable: true })
  departamentoOrigenId!: string | null;

  @Column({ name: "municipio_origen_id", type: "bigint", nullable: true })
  municipioOrigenId!: string | null;

  @Column({ name: "estado_estudio_id", type: "bigint", nullable: true })
  estadoEstudioId!: string | null;

  @Column({ type: "integer", default: 1 })
  version!: number;

  @Column({ name: "creado_en", type: "timestamptz" })
  creadoEn!: Date;

  @Column({ name: "actualizado_en", type: "timestamptz" })
  actualizadoEn!: Date;
}
