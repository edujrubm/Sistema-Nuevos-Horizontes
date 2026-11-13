import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import { AmbitoLocalService } from "../../../common/registros-area/ambito-local.service";
import {
  RegistroAreaRepository,
  camel,
} from "../../../common/registros-area/registro-area.repository";
import { ListaDto } from "../../../common/dto/pagina.dto";
const DETAILS = { GUARDERIA: "ficha_guarderia" } as const;
type Tipo = keyof typeof DETAILS;
@Injectable()
export class GuarderiaService {
  constructor(
    readonly repo: RegistroAreaRepository,
    readonly ambito: AmbitoLocalService,
  ) {}
  async fichas(
    beneficiaria: string | null,
    hijo: string | null,
    tipo: Tipo,
    q: ListaDto,
  ) {
    const expediente = beneficiaria
      ? await this.repo.expediente(beneficiaria)
      : (await this.repo.hijo(hijo!)).expediente_id;
    if (tipo === "GUARDERIA") {
      const [inscrito] = await this.repo.data.query(
        "SELECT EXISTS(SELECT 1 FROM new_horizons.formulario_area f JOIN new_horizons.ficha_guarderia d ON d.formulario_id=f.id WHERE f.nino_id=$1 AND f.tipo='GUARDERIA' AND f.estado_codigo=$2) AS inscrito",
        [hijo, this.state("FORM_CONFIRMED_STATE_CODE")],
      );
      if (!inscrito.inscrito) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }
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
  async hijos(id: string, q: ListaDto) {
    const expediente = await this.repo.expediente(id);
    const { filas: rows, total } = await this.repo.pagina(
      "SELECT n.nino_id,n.nombre,n.fecha_nac,n.expediente_id,EXISTS(SELECT 1 FROM new_horizons.formulario_area f JOIN new_horizons.ficha_guarderia d ON d.formulario_id=f.id WHERE f.nino_id=n.nino_id AND f.tipo='GUARDERIA' AND f.estado_codigo=$4) AS inscrito FROM new_horizons.nino n WHERE n.expediente_id=$1 ORDER BY n.nino_id LIMIT $2 OFFSET $3",
      [
        expediente,
        q.limite,
        (q.pagina - 1) * q.limite,
        this.state("FORM_CONFIRMED_STATE_CODE"),
      ],
      "SELECT count(*) AS total FROM new_horizons.nino WHERE expediente_id=$1",
      [expediente],
    );
    return {
      datos: rows.map(camel),
      pagina: q.pagina,
      limite: q.limite,
      total,
    };
  }
  state(key: "FORM_DRAFT_STATE_CODE" | "FORM_CONFIRMED_STATE_CODE") {
    const code = process.env[key];
    if (!code) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return code;
  }
}
