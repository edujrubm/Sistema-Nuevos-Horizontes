import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'new_horizons', name: 'nino' })
export class Nino {
  @PrimaryGeneratedColumn({ name: 'nino_id', type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cui!: string | null;

  @Column({ type: 'varchar', length: 60 })
  nombre!: string;

  @Column({ name: 'fecha_nac', type: 'date', nullable: true })
  fechaNacimiento!: string | null;

  @Column({ name: 'reconocido', type: 'boolean', nullable: true })
  reconocido!: boolean | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  genero!: string | null;

  @Column({ name: 'expediente_id', type: 'bigint' })
  expedienteId!: string;
}
