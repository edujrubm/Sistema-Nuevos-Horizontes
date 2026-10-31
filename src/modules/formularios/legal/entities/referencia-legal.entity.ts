import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "new_horizons", name: "referencia_legal" })
export class ReferenciaLegal {
  @PrimaryColumn({ name: "formulario_id", type: "bigint" })
  formularioId!: string;
  @Column({ name: "destino", type: "text", nullable: true }) destino!:
    string | null;
  @Column({ name: "origen", type: "text", nullable: true }) origen!:
    string | null;
  @Column({ name: "motivo_referencia", type: "text", nullable: true })
  motivoReferencia!: string | null;
  @Column({ name: "recomendaciones", type: "text", nullable: true })
  recomendaciones!: string | null;
}
