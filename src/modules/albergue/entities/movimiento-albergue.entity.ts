import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'new_horizons',
  name: 'movimiento_albergue',
})
export class MovimientoAlbergue {
  @PrimaryGeneratedColumn('identity', {
    name: 'movimiento_albergue_id',
    type: 'bigint',
  })
  id!: string;

  @Column({
    name: 'salida',
    type: 'timestamptz',
  })
  salida!: Date;

  @Column({
    name: 'entrada',
    type: 'timestamptz',
    nullable: true,
  })
  entrada!: Date | null;

  @Column({
    name: 'trabajador_asignado',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  trabajadorAsignado!: string | null;

  @Column({
    name: 'destino',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  destino!: string | null;

  @Column({
    name: 'activo_albergue_id',
    type: 'bigint',
  })
  activoAlbergueId!: string;
}
