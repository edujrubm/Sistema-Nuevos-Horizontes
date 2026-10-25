import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'new_horizons', name: 'beneficiaria' })
export class Beneficiaria {
  @PrimaryGeneratedColumn({ name: 'id_beneficiaria', type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cui!: string | null;

  @Column({ type: 'varchar', length: 60 })
  nombre!: string;

  @Column({ name: 'fecha_nac', type: 'date', nullable: true })
  fechaNacimiento!: string | null;
}
