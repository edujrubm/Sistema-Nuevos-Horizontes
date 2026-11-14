import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import {
  RegistroAreaRepository,
  camel,
} from "../../../../common/registros-area/registro-area.repository";
import { ListaDto } from "../../../../common/dto/pagina.dto";
import { TransicionDto } from "../../../../common/dto/version.dto";
import {
  CrearReferenciaDto,
  EditarReferenciaDto,
} from "../dto/referencia-legal.dto";
import { validarReferenciaCompleta } from "../validation/validar-referencia";
const DETAILS = {
  LEGAL: "ficha_legal",
  REFERENCIA_LEGAL: "referencia_legal",
} as const;
type Tipo = keyof typeof DETAILS;
/** Conserva la implementación publicada hasta aplicar la reconstrucción de Legal. */
@Injectable()
export class ReferenciaActualRepository extends RegistroAreaRepository {
  constructor(data: DataSource) {
    super(data);
  }
  async referencia(
    id: string,
    manager = this.data.manager,
    lock = false,
  ): Promise<Record<string, unknown>> {
    const form = await this.formulario(id, manager, lock);
    if (form.tipo !== "REFERENCIA_LEGAL")
      throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const [detail] = await manager.query(
      "SELECT destino,origen,motivo_referencia,recomendaciones,medio_entrega FROM new_horizons.referencia_legal WHERE formulario_id=$1",
      [id],
    );
    if (!detail) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const { beneficiaria_id: beneficiariaId, ...header } = form;
    return { ...camel(header), beneficiariaId, detalle: camel(detail) };
  }
}
@Injectable()
export class ConsultaActualRepository {
  constructor(readonly repo: ReferenciaActualRepository) {}
  referencia(id: string) {
    return this.repo.referencia(id);
  }
  async fichas(
    beneficiaria: string | null,
    hijo: string | null,
    tipo: Tipo,
    q: ListaDto,
  ) {
    const expediente = beneficiaria
      ? await this.repo.expediente(beneficiaria)
      : (await this.repo.hijo(hijo!)).expediente_id;
    // El identificador de tabla procede exclusivamente de esta lista cerrada.
    const { filas: rows, total } = await this.repo.pagina(
      `SELECT f.*,new_horizons.local_json_seguro(to_jsonb(d)-'formulario_id'-'tipo') AS detalle FROM new_horizons.formulario_area f JOIN new_horizons.${DETAILS[tipo]} d ON d.formulario_id=f.id WHERE f.expediente_id=$1 AND f.tipo=$2 AND ($3::bigint IS NULL OR f.nino_id=$3) ORDER BY f.fecha_atencion DESC,f.id DESC LIMIT $4 OFFSET $5`,
      [expediente, tipo, hijo, q.limite, (q.pagina - 1) * q.limite],
      `SELECT count(*) AS total FROM new_horizons.formulario_area f JOIN new_horizons.${DETAILS[tipo]} d ON d.formulario_id=f.id WHERE f.expediente_id=$1 AND f.tipo=$2 AND ($3::bigint IS NULL OR f.nino_id=$3)`,
      [expediente, tipo, hijo],
    );
    return {
      datos: rows.map((r: Record<string, unknown>) => ({
        ...camel(r),
        detalle: camel(r.detalle as Record<string, unknown>),
      })),
      pagina: q.pagina,
      limite: q.limite,
      total,
    };
  }
  async crearReferencia(id: string, dto: CrearReferenciaDto) {
    if (!dto.detalle) throw new ErrorApi("DATOS_INVALIDOS");
    return this.repo.transaction(
      "Creación de referencia Legal",
      async (m, actor) => {
        const expediente = await this.repo.expediente(id, m);
        const [tipo] = await m.query(
          "SELECT area_id FROM new_horizons.tipo_formulario WHERE codigo='REFERENCIA_LEGAL'",
        );
        if (!tipo) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
        const [identidad] = await m.query(
          "SELECT nombre,cui,fecha_nac,extract(year FROM age(($2::timestamptz AT TIME ZONE 'America/Guatemala')::date,fecha_nac))::integer AS edad_a_la_atencion FROM new_horizons.beneficiaria WHERE id_beneficiaria=$1",
          [id, dto.fechaAtencion],
        );
        const [f] = await m.query(
          "INSERT INTO new_horizons.formulario_area(expediente_id,area_id,tipo,estado_codigo,fecha_atencion,profesional_id,capturado_por,identidad_al_atender) VALUES($1,$2,'REFERENCIA_LEGAL',$3,$4,$5,$6,$7) RETURNING id",
          [
            expediente,
            tipo.area_id,
            this.state("FORM_DRAFT_STATE_CODE"),
            dto.fechaAtencion,
            dto.profesionalId,
            actor,
            JSON.stringify(identidad),
          ],
        );
        await m.query(
          "INSERT INTO new_horizons.referencia_legal(formulario_id,destino,origen,motivo_referencia,recomendaciones,medio_entrega) VALUES($1,$2,$3,$4,$5,$6)",
          [
            f.id,
            dto.detalle.destino ?? null,
            dto.detalle.origen ?? null,
            dto.detalle.motivoReferencia ?? null,
            dto.detalle.recomendaciones ?? null,
            dto.detalle.medioEntrega ?? null,
          ],
        );
        return this.repo.referencia(f.id, m);
      },
    );
  }
  async editarReferencia(id: string, dto: EditarReferenciaDto) {
    if (
      !dto.detalle ||
      !Object.values(dto.detalle).some((valor) => valor !== undefined)
    )
      throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
    return this.repo.transaction(dto.motivo, async (m) => {
      const row = await this.repo.referencia(id, m, true);
      this.repo.version(row.version as number, dto.version);
      if (
        ![
          this.state("FORM_DRAFT_STATE_CODE"),
          this.state("FORM_CONFIRMED_STATE_CODE"),
        ].includes(row.estadoCodigo as string)
      )
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (row.estadoCodigo === this.state("FORM_CONFIRMED_STATE_CODE")) {
        validarReferenciaCompleta({
          ...(row.detalle as Record<string, unknown>),
          ...Object.fromEntries(
            Object.entries(dto.detalle).filter(
              ([, valor]) => valor !== undefined,
            ),
          ),
        });
      }
      const names: Record<string, string> = {
        destino: "destino",
        origen: "origen",
        motivoReferencia: "motivo_referencia",
        recomendaciones: "recomendaciones",
        medioEntrega: "medio_entrega",
      };
      const pairs = Object.entries(dto.detalle).filter(
        ([k, v]) => names[k] && v !== undefined,
      );
      await m.query(
        `UPDATE new_horizons.referencia_legal SET ${pairs.map(([k], i) => `${names[k]}=$${i + 2}`).join(",")} WHERE formulario_id=$1`,
        [id, ...pairs.map(([, v]) => v)],
      );
      return this.repo.referencia(id, m);
    });
  }
  async confirmarReferencia(id: string, dto: TransicionDto) {
    return this.repo.transaction(dto.motivo, async (m) => {
      const row = await this.repo.referencia(id, m, true);
      this.repo.version(row.version as number, dto.version);
      if (row.estadoCodigo !== this.state("FORM_DRAFT_STATE_CODE"))
        throw new ErrorApi(
          row.estadoCodigo === this.state("FORM_CONFIRMED_STATE_CODE")
            ? "FORMULARIO_YA_CONFIRMADO"
            : "ESTADO_NO_PERMITIDO",
        );
      validarReferenciaCompleta(row.detalle as Record<string, unknown>);
      const confirmed = this.state("FORM_CONFIRMED_STATE_CODE");
      if (confirmed === this.state("FORM_DRAFT_STATE_CODE"))
        throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      await m.query(
        "UPDATE new_horizons.formulario_area SET estado_codigo=$2,motivo_cambio=$3 WHERE id=$1",
        [id, confirmed, dto.motivo],
      );
      return this.repo.referencia(id, m);
    });
  }
  state(key: "FORM_DRAFT_STATE_CODE" | "FORM_CONFIRMED_STATE_CODE") {
    const code = process.env[key];
    if (!code) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return code;
  }
}
