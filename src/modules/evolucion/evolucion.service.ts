import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../common/errors/error-api";
import { AmbitoLocalService } from "../../common/registros-area/ambito-local.service";
import {
  RegistroAreaRepository,
  camel,
} from "../../common/registros-area/registro-area.repository";
import { ListaDto } from "../../common/dto/pagina.dto";
import {
  CrearEntradaDto,
  CorregirEntradaDto,
  EvolucionListaDto,
} from "./dto/entrada-evolutiva.dto";

@Injectable()
export class EvolucionService {
  constructor(
    readonly repo: RegistroAreaRepository,
    readonly ambito: AmbitoLocalService,
  ) {}
  state(key: "FORM_DRAFT_STATE_CODE" | "FORM_CONFIRMED_STATE_CODE") {
    const code = process.env[key];
    if (!code) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return code;
  }
  async evolucion(id: string, q: EvolucionListaDto) {
    const area = this.ambito.area();
    this.ambito.comprobar(area, q.area);
    const expediente = await this.repo.expediente(id);
    if (q.formularioId) await this.comprobarFormulario(q.formularioId);
    if (q.hijoId) {
      const child = await this.repo.hijo(q.hijoId);
      if (child.expediente_id !== expediente)
        throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }
    const { filas: rows, total } = await this.repo.pagina(
      `SELECT e.*,f.area_id,f.tipo,f.nino_id FROM new_horizons.entrada_evolutiva e JOIN new_horizons.formulario_area f ON f.id=e.formulario_id JOIN new_horizons.area a ON a.id_area=f.area_id WHERE f.expediente_id=$1 AND ($2::text IS NULL OR a.nombre_area=$2) AND ($3::bigint IS NULL OR f.id=$3) AND ($4::bigint IS NULL OR f.nino_id=$4) ORDER BY e.fecha_atencion,e.id LIMIT $5 OFFSET $6`,
      [
        expediente,
        area,
        q.formularioId ?? null,
        q.hijoId ?? null,
        q.limite,
        (q.pagina - 1) * q.limite,
      ],
      `SELECT count(*) AS total FROM new_horizons.entrada_evolutiva e JOIN new_horizons.formulario_area f ON f.id=e.formulario_id JOIN new_horizons.area a ON a.id_area=f.area_id WHERE f.expediente_id=$1 AND a.nombre_area=$2 AND ($3::bigint IS NULL OR f.id=$3) AND ($4::bigint IS NULL OR f.nino_id=$4)`,
      [expediente, area, q.formularioId ?? null, q.hijoId ?? null],
    );
    return {
      datos: rows.map(camel),
      pagina: q.pagina,
      limite: q.limite,
      total,
    };
  }
  async crearEntrada(id: string, dto: CrearEntradaDto) {
    return this.repo.transaction(
      "Nueva entrada evolutiva",
      async (m, actor) => {
        const form = await this.repo.formulario(dto.formularioId, m, true);
        if (form.beneficiaria_id !== id)
          throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
        await this.comprobarFormulario(dto.formularioId, m);
        // Regla confirmada: solo seguimiento de formularios confirmados.
        if (form.estado_codigo !== this.state("FORM_CONFIRMED_STATE_CODE"))
          throw new ErrorApi("FORMULARIO_NO_CONFIRMADO");
        const [row] = await m.query(
          "INSERT INTO new_horizons.entrada_evolutiva(formulario_id,accion,contenido,fecha_atencion,profesional_id,capturado_por,plan_seguimiento,resultado) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [
            dto.formularioId,
            dto.accion,
            dto.contenido,
            dto.fechaAtencion,
            dto.profesionalId,
            actor,
            dto.planSeguimiento ?? null,
            dto.resultado ?? null,
          ],
        );
        return camel(row);
      },
    );
  }
  async corregirEntrada(id: string, dto: CorregirEntradaDto) {
    const names: Record<string, string> = {
      accion: "accion",
      contenido: "contenido",
      fechaAtencion: "fecha_atencion",
      profesionalId: "profesional_id",
      planSeguimiento: "plan_seguimiento",
      resultado: "resultado",
    };
    const pairs = Object.entries(dto).filter(
      ([k, v]) => names[k] && v !== undefined,
    );
    if (!pairs.length) throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
    if (
      pairs.some(
        ([k, v]) => v === null && !["planSeguimiento", "resultado"].includes(k),
      )
    )
      throw new ErrorApi(
        "DATOS_INVALIDOS",
        pairs
          .filter(
            ([k, v]) =>
              v === null && !["planSeguimiento", "resultado"].includes(k),
          )
          .map(([campo]) => ({
            campo,
            mensaje: "Este campo obligatorio no admite un valor nulo.",
          })),
      );
    return this.repo.transaction(dto.motivo, async (m) => {
      // Mismo orden de bloqueo que el alta: cabecera, luego entrada.
      const [entry] = await m.query(
        "SELECT formulario_id FROM new_horizons.entrada_evolutiva WHERE id=$1",
        [id],
      );
      if (!entry) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      await this.repo.formulario(entry.formulario_id, m, true);
      await this.comprobarFormulario(entry.formulario_id, m);
      const [row] = await m.query(
        "SELECT * FROM new_horizons.entrada_evolutiva WHERE id=$1 FOR UPDATE",
        [id],
      );
      this.repo.version(row.version, dto.version);
      await m.query(
        `UPDATE new_horizons.entrada_evolutiva SET ${pairs.map(([k], i) => `${names[k]}=$${i + 3}`).join(",")},motivo_cambio=$2 WHERE id=$1`,
        [id, dto.motivo, ...pairs.map(([, v]) => v)],
      );
      const [updated] = await m.query(
        "SELECT * FROM new_horizons.entrada_evolutiva WHERE id=$1",
        [id],
      );
      return camel(updated);
    });
  }
  async comprobarFormulario(id: string, manager = this.repo.data.manager) {
    const [f] = await manager.query(
      "SELECT f.area_id,a.nombre_area FROM new_horizons.formulario_area f JOIN new_horizons.area a ON a.id_area=f.area_id WHERE f.id=$1",
      [id],
    );
    if (!f) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    this.ambito.comprobar(f.nombre_area);
    return f;
  }
  async revisiones(id: string, q: ListaDto) {
    this.ambito.coordinacion();
    const [entry] = await this.repo.data.query(
      "SELECT formulario_id FROM new_horizons.entrada_evolutiva WHERE id=$1",
      [id],
    );
    if (!entry) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    await this.comprobarFormulario(entry.formulario_id);
    const { filas: rows, total } = await this.repo.pagina(
      "SELECT r.id,r.operacion,CASE WHEN r.anterior IS NULL THEN NULL ELSE r.anterior || jsonb_build_object('profesional_id',r.anterior->>'profesional_id') END AS anterior,r.nuevo || jsonb_build_object('profesional_id',r.nuevo->>'profesional_id') AS nuevo,r.actor_id,r.motivo,r.registrado_en,u.nombre_usuario,e.nombre AS autor_nombre FROM new_horizons.revision_registro r JOIN new_horizons.usuario u ON u.id_usuario=r.actor_id LEFT JOIN new_horizons.empleado e ON e.id_empleado=u.id_empleado WHERE r.tabla='entrada_evolutiva' AND r.registro_id=$1 ORDER BY r.id LIMIT $2 OFFSET $3",
      [id, q.limite, (q.pagina - 1) * q.limite],
      "SELECT count(*) AS total FROM new_horizons.revision_registro WHERE tabla='entrada_evolutiva' AND registro_id=$1",
      [id],
    );
    const fields = [
      "accion",
      "contenido",
      "plan_seguimiento",
      "resultado",
      "fecha_atencion",
      "profesional_id",
    ];
    return {
      datos: rows.map((row: Record<string, any>) => ({
        id: row.id,
        operacion: row.operacion,
        autor: {
          usuarioId: row.actor_id,
          nombre: row.autor_nombre ?? row.nombre_usuario,
        },
        fecha: row.registrado_en,
        motivo: row.motivo,
        cambios: fields
          .filter(
            (k) =>
              (row.operacion === "INSERT" && row.nuevo?.[k] != null) ||
              JSON.stringify(row.anterior?.[k] ?? null) !==
                JSON.stringify(row.nuevo?.[k] ?? null),
          )
          .map((k) => ({
            campo: k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
            antes: row.anterior?.[k] ?? null,
            despues: row.nuevo?.[k] ?? null,
          })),
      })),
      pagina: q.pagina,
      limite: q.limite,
      total,
    };
  }
}
