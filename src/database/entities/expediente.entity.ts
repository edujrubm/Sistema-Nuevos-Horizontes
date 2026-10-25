import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Punto de entrada permanente del expediente institucional.
 * synchronize permanece desactivado: el DDL versionado es la fuente de verdad.
 */
@Entity({ schema: 'new_horizons', name: 'expediente' })
export class Expediente {
  @PrimaryGeneratedColumn({ name: 'id_expediente', type: 'bigint' })
  id!: string;

  @Column({ name: 'beneficiaria_id', type: 'bigint', unique: true })
  beneficiariaId!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  @Column({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn!: Date;

  @Column({ type: 'integer' })
  version!: number;
}
