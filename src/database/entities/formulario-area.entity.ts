import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'new_horizons', name: 'formulario_area' })
export class FormularioArea {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'expediente_id', type: 'bigint' })
  expedienteId!: string;

  @Column({ name: 'nino_id', type: 'bigint', nullable: true })
  ninoId!: string | null;

  @Column({ name: 'area_id', type: 'bigint' })
  areaId!: string;

  @Column({ type: 'text' })
  tipo!: string;

  @Column({ name: 'estado_codigo', type: 'text' })
  estadoCodigo!: string;

  @Column({ name: 'fecha_atencion', type: 'timestamptz' })
  fechaAtencion!: Date;

  @Column({ name: 'profesional_id', type: 'bigint' })
  profesionalId!: string;

  @Column({ name: 'capturado_por', type: 'bigint' })
  capturadoPor!: string;

  @Column({ name: 'version', type: 'integer' })
  version!: number;
}
