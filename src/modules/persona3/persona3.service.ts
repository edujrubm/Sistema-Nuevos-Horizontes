import { ErrorApi } from "../../common/errors/error-api";
import { Injectable } from "@nestjs/common";
import { AmbitoLocalService } from "./ambito-local.service";
import { camel, Persona3Repository } from "./persona3.repository";
import {
  CorregirEntradaDto,
  CrearEntradaDto,
  CrearReferenciaDto,
  EditarReferenciaDto,
  EvolucionListaDto,
  ListaDto,
  TransicionDto,
} from "./dto/contratos.dto";

const DETAILS = {
  SOCIAL: "ficha_social",
  LEGAL: "ficha_legal",
  GUARDERIA: "ficha_guarderia",
  REFERENCIA_LEGAL: "referencia_legal",
} as const;
type Tipo = keyof typeof DETAILS;

@Injectable()
export class Persona3Service {
  constructor(
    readonly repo: Persona3Repository,
    readonly ambito: AmbitoLocalService,
  ) {}

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
    if (tipo === "GUARDERIA") {
      const [inscrito] = await this.repo.data.query(
        "SELECT EXISTS(SELECT 1 FROM new_horizons.formulario_area f JOIN new_horizons.ficha_guarderia d ON d.formulario_id=f.id WHERE f.nino_id=$1 AND f.tipo='GUARDERIA' AND f.estado_codigo=$2) AS inscrito",
        [hijo, this.state("P3_CONFIRMED_STATE")],
      );
      if (!inscrito.inscrito) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    }
    // El identificador de tabla procede exclusivamente de esta lista cerrada.
    const { filas: rows, total } = await this.repo.pagina(
      `SELECT f.*,to_jsonb(d)-'formulario_id'-'tipo' AS detalle FROM new_horizons.formulario_area f JOIN new_horizons.${DETAILS[tipo]} d ON d.formulario_id=f.id WHERE f.expediente_id=$1 AND f.tipo=$2 AND ($3::bigint IS NULL OR f.nino_id=$3) ORDER BY f.fecha_atencion DESC,f.id DESC LIMIT $4 OFFSET $5`,
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

  async resumenSocial(id: string) {
    const expediente = await this.repo.expediente(id);
    const rows = await this.repo.data.query(
      "SELECT count(*)::integer AS total_fichas,max(fecha_atencion) AS ultima_atencion FROM new_horizons.formulario_area WHERE expediente_id=$1 AND tipo='SOCIAL'",
      [expediente],
    );
    const [persona] = await this.repo.data.query(
      "SELECT id_beneficiaria AS id,nombre,fecha_nac,CASE WHEN cui IS NULL THEN NULL ELSE '***' || right(cui,4) END AS cui_protegido,extract(year FROM age((now() AT TIME ZONE 'America/Guatemala')::date,fecha_nac))::integer AS edad_calculada FROM new_horizons.beneficiaria WHERE id_beneficiaria=$1",
      [id],
    );
    const [ficha] = await this.repo.data.query(
      "SELECT f.id,f.estado_codigo,f.fecha_atencion,f.actualizado_en,f.version,f.profesional_id,p.nombre AS profesional_nombre,d.historia_violencia,d.diagnostico_social,d.riesgos_identificados,d.plan_eliminacion_riesgos,d.objetivo_general,d.actividades,d.evaluacion FROM new_horizons.formulario_area f JOIN new_horizons.ficha_social d ON d.formulario_id=f.id JOIN new_horizons.empleado p ON p.id_empleado=f.profesional_id WHERE f.expediente_id=$1 AND f.tipo='SOCIAL' ORDER BY f.fecha_atencion DESC,f.id DESC LIMIT 1",
      [expediente],
    );
    const seguimientos = await this.repo.data.query(
      "SELECT e.id,e.accion,e.contenido,e.fecha_atencion,e.plan_seguimiento,e.resultado,e.profesional_id,p.nombre AS profesional_nombre FROM new_horizons.entrada_evolutiva e JOIN new_horizons.formulario_area f ON f.id=e.formulario_id JOIN new_horizons.empleado p ON p.id_empleado=e.profesional_id WHERE f.expediente_id=$1 AND f.tipo='SOCIAL' ORDER BY e.fecha_atencion DESC,e.id DESC LIMIT 5",
      [expediente],
    );
    return {
      beneficiariaId: id,
      expedienteId: expediente,
      ...camel(rows[0]),
      beneficiaria: camel(persona),
      ultimaFicha: ficha ? camel(ficha) : null,
      historialReciente: seguimientos.map(camel),
      camposSinSoporte: [
        "tipoVivienda",
        "redesApoyo",
        "dependenciaEconomica",
        "responsablePlan",
        "fechaRevision",
        "fechaCierre",
        "resultadosCierre",
        "observacionesCierre",
      ],
      totalRiesgos: null,
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
        this.state("P3_CONFIRMED_STATE"),
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

  state(key: "P3_DRAFT_STATE" | "P3_CONFIRMED_STATE") {
    const code = process.env[key];
    if (!code) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return code;
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
            this.state("P3_DRAFT_STATE"),
            dto.fechaAtencion,
            dto.profesionalId,
            actor,
            JSON.stringify(identidad),
          ],
        );
        await m.query(
          "INSERT INTO new_horizons.referencia_legal(formulario_id,destino,origen,motivo_referencia,recomendaciones) VALUES($1,$2,$3,$4,$5)",
          [
            f.id,
            dto.detalle.destino ?? null,
            dto.detalle.origen ?? null,
            dto.detalle.motivoReferencia ?? null,
            dto.detalle.recomendaciones ?? null,
          ],
        );
        return this.repo.referencia(f.id, m);
      },
    );
  }

  validarReferenciaCompleta(detalle: Record<string, unknown>) {
    const errores = [
      {
        campo: "detalle.destino",
        valor: detalle.destino,
        mensaje: "Indica la institución o el destino de la referencia.",
      },
      {
        campo: "detalle.motivoReferencia",
        valor: detalle.motivoReferencia,
        mensaje: "Escribe el motivo de la referencia.",
      },
    ]
      .filter((d) => typeof d.valor !== "string" || !d.valor.trim())
      .map(({ campo, mensaje }) => ({ campo, mensaje }));
    if (errores.length) throw new ErrorApi("DATOS_INVALIDOS", errores);
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
          this.state("P3_DRAFT_STATE"),
          this.state("P3_CONFIRMED_STATE"),
        ].includes(row.estadoCodigo as string)
      )
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (row.estadoCodigo === this.state("P3_CONFIRMED_STATE")) {
        this.validarReferenciaCompleta({
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
      if (row.estadoCodigo !== this.state("P3_DRAFT_STATE"))
        throw new ErrorApi(
          row.estadoCodigo === this.state("P3_CONFIRMED_STATE")
            ? "FORMULARIO_YA_CONFIRMADO"
            : "ESTADO_NO_PERMITIDO",
        );
      this.validarReferenciaCompleta(row.detalle as Record<string, unknown>);
      const confirmed = this.state("P3_CONFIRMED_STATE");
      if (confirmed === this.state("P3_DRAFT_STATE"))
        throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      await m.query(
        "UPDATE new_horizons.formulario_area SET estado_codigo=$2,motivo_cambio=$3 WHERE id=$1",
        [id, confirmed, dto.motivo],
      );
      return this.repo.referencia(id, m);
    });
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
        if (form.estado_codigo !== this.state("P3_CONFIRMED_STATE"))
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
