import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'new_horizons', name: 'activos_albergue' })
export class ActivoAlbergue {
  @PrimaryGeneratedColumn('identity', {
    name: 'activo_albergue_id',
    type: 'bigint',
  })
  id!: string;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fechaIngreso!: string;

  @Column({
    name: 'fecha_egreso',
    type: 'date',
    nullable: true,
  })
  fechaEgreso!: string | null;

  @Column({ name: 'beneficiaria_id', type: 'bigint' })
  beneficiariaId!: string;

  @Column({
    name: 'estado_albergue_id',
    type: 'bigint',
    nullable: true,
  })
  estadoAlbergueId!: string | null;
}
