import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, EntityManager } from "typeorm";

import { ActualizarFormularioDto } from "./dto/actualizar-formulario.dto";
import { CrearFormularioDto } from "./dto/crear-formulario.dto";
import { ListarFormulariosDto } from "./dto/listar-formularios.dto";
import {
  aSnakeCase,
  CodigoTipoFormulario,
  TIPOS_FORMULARIO,
} from "./formulario-tipos";

export interface FormularioAreaRow {
  id: string;
  expedienteId: string;
  ninoId: string | null;
  areaId: string;
  area: string;
  tipo: CodigoTipoFormulario;
  estado: string;
  fechaAtencion: Date;
  profesionalId: string;
  capturadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
  version: number;
  detalle: Record<string, unknown>;
  examenMental: Record<string, unknown> | null;
}

interface ContextoAuditoria {
  usuarioId: string;
  empleadoId: string;
}

@Injectable()
export class FormularioSharedRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private get estadoBorrador() {
    return this.config.get<string>("FORM_DRAFT_STATE_CODE", "BORRADOR");
  }

  private get estadoConfirmado() {
    return this.config.get<string>("FORM_CONFIRMED_STATE_CODE", "CONFIRMADO");
  }

  private async prepararAuditoria(
    manager: EntityManager,
    motivo: string,
  ): Promise<ContextoAuditoria> {
    const username = this.config.get<string>(
      "AUDIT_ACTOR_USERNAME",
      "actor_pruebas_persona1",
    );
    const rows = await manager.query<ContextoAuditoria[]>(
      `SELECT u.id_usuario::text AS "usuarioId",
              u.id_empleado::text AS "empleadoId"
       FROM new_horizons.usuario u
       WHERE u.nombre_usuario = $1`,
      [username],
    );
    if (!rows[0])
      throw new Error("No existe el actor técnico de auditoría configurado.");
    await manager.query("SELECT set_config('new_horizons.actor_id',$1,true)", [
      rows[0].usuarioId,
    ]);
    await manager.query("SELECT set_config('new_horizons.motivo',$1,true)", [
      motivo,
    ]);
    return rows[0];
  }

  private async estadoExiste(manager: EntityManager, codigo: string) {
    const rows = await manager.query<Array<{ existe: boolean }>>(
      `SELECT EXISTS(
         SELECT 1 FROM new_horizons.estado_formulario WHERE codigo = $1
       ) AS existe`,
      [codigo],
    );
    return rows[0]?.existe ?? false;
  }

  private detalleSql() {
    return `COALESCE(
      to_jsonb(pm) - 'formulario_id' - 'tipo',
      to_jsonb(pn) - 'formulario_id' - 'tipo',
      to_jsonb(fs) - 'formulario_id' - 'tipo',
      to_jsonb(cm) - 'formulario_id' - 'tipo',
      to_jsonb(fl) - 'formulario_id' - 'tipo',
      to_jsonb(rl) - 'formulario_id' - 'tipo',
      to_jsonb(fg) - 'formulario_id' - 'tipo',
      '{}'::jsonb
    )`;
  }

  private joinsDetalleSql() {
    return `LEFT JOIN new_horizons.psicologia_mujer pm ON pm.formulario_id=f.id
      LEFT JOIN new_horizons.psicologia_ninez pn ON pn.formulario_id=f.id
      LEFT JOIN new_horizons.ficha_social fs ON fs.formulario_id=f.id
      LEFT JOIN new_horizons.consulta_medica cm ON cm.formulario_id=f.id
      LEFT JOIN new_horizons.ficha_legal fl ON fl.formulario_id=f.id
      LEFT JOIN new_horizons.referencia_legal rl ON rl.formulario_id=f.id
      LEFT JOIN new_horizons.ficha_guarderia fg ON fg.formulario_id=f.id
      LEFT JOIN new_horizons.psicologia_examen_mental pem ON pem.formulario_id=f.id`;
  }

  private selectFormularioSql() {
    return `SELECT f.id::text AS id,
        f.expediente_id::text AS "expedienteId",
        f.nino_id::text AS "ninoId",
        f.area_id::text AS "areaId", a.nombre_area AS area,
        f.tipo, f.estado_codigo AS estado,
        f.fecha_atencion AS "fechaAtencion",
        f.profesional_id::text AS "profesionalId",
        f.capturado_por::text AS "capturadoPor",
        f.creado_en AS "creadoEn", f.actualizado_en AS "actualizadoEn",
        f.version, ${this.detalleSql()} AS detalle,
        CASE WHEN pem.formulario_id IS NULL THEN NULL
          ELSE to_jsonb(pem) - 'formulario_id' END AS "examenMental"
      FROM new_horizons.formulario_area f
      JOIN new_horizons.area a ON a.id_area=f.area_id
      ${this.joinsDetalleSql()}`;
  }

  async listar(beneficiariaId: string, filtro: ListarFormulariosDto) {
    const condiciones = ["e.beneficiaria_id = $1::bigint"];
    const parametros: unknown[] = [beneficiariaId];
    if (filtro.cursor) {
      parametros.push(filtro.cursor);
      condiciones.push(`f.id > $${parametros.length}::bigint`);
    }
    if (filtro.areaId) {
      parametros.push(filtro.areaId);
      condiciones.push(`f.area_id = $${parametros.length}::bigint`);
    }
    if (filtro.tipo) {
      parametros.push(filtro.tipo);
      condiciones.push(`f.tipo = $${parametros.length}`);
    }
    parametros.push(filtro.limite + 1);
    return this.dataSource.query<FormularioAreaRow[]>(
      `${this.selectFormularioSql()}
       JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id
       WHERE ${condiciones.join(" AND ")}
       ORDER BY f.id ASC LIMIT $${parametros.length}`,
      parametros,
    );
  }

  async obtener(id: string, manager?: EntityManager) {
    const executor = manager ?? this.dataSource.manager;
    const rows = await executor.query<FormularioAreaRow[]>(
      `${this.selectFormularioSql()} WHERE f.id=$1::bigint`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async insertarDetalle(
    manager: EntityManager,
    formularioId: string,
    tipo: CodigoTipoFormulario,
    detalle: Record<string, unknown>,
  ) {
    const definicion = TIPOS_FORMULARIO[tipo];
    const entradas = Object.entries(detalle);
    const columnas = entradas.map(([campo]) => aSnakeCase(campo));
    const valores = entradas.map(([, valor]) => valor);
    const nombres = ["formulario_id", "tipo", ...columnas];
    const placeholders = nombres.map((_, indice) => `$${indice + 1}`);
    await manager.query(
      `INSERT INTO new_horizons.${definicion.tabla} (${nombres.join(",")})
       VALUES (${placeholders.join(",")})`,
      [formularioId, tipo, ...valores],
    );
  }

  private async insertarExamenMental(
    manager: EntityManager,
    formularioId: string,
    examen: Record<string, unknown>,
  ) {
    const entradas = Object.entries(examen);
    const columnas = entradas.map(([campo]) => aSnakeCase(campo));
    const nombres = ["formulario_id", ...columnas];
    const placeholders = nombres.map((_, indice) => `$${indice + 1}`);
    await manager.query(
      `INSERT INTO new_horizons.psicologia_examen_mental (${nombres.join(",")})
       VALUES (${placeholders.join(",")})`,
      [formularioId, ...entradas.map(([, valor]) => valor)],
    );
  }

  async crear(beneficiariaId: string, entrada: CrearFormularioDto) {
    return this.dataSource.transaction(async (manager) => {
      const auditor = await this.prepararAuditoria(
        manager,
        "Creación de formulario de área",
      );
      if (!(await this.estadoExiste(manager, this.estadoBorrador)))
        return { estado: "CATALOGO_ESTADO_NO_CONFIGURADO" as const };

      const tipos = await manager.query<
        Array<{ areaId: string; area: string; descripcion: string }>
      >(
        `SELECT tf.area_id::text AS "areaId", a.nombre_area AS area,
                tf.descripcion
         FROM new_horizons.tipo_formulario tf
         JOIN new_horizons.area a ON a.id_area=tf.area_id
         WHERE tf.codigo=$1`,
        [entrada.tipo],
      );
      if (!tipos[0]) return { estado: "TIPO_NO_ENCONTRADO" as const };

      const expedientes = await manager.query<
        Array<{
          id: string;
          activa: boolean;
          nombre: string;
          cui: string | null;
          fechaNacimiento: string | null;
        }>
      >(
        `SELECT e.id_expediente::text AS id,
                coalesce((to_jsonb(e)->>'activo')::boolean,true) AS activa,
                b.nombre, b.cui, b.fecha_nac AS "fechaNacimiento"
         FROM new_horizons.expediente e
         JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=e.beneficiaria_id
         WHERE e.beneficiaria_id=$1::bigint`,
        [beneficiariaId],
      );
      if (!expedientes[0] || !expedientes[0].activa)
        return { estado: "SIN_EXPEDIENTE" as const };

      let sujeto: {
        tipo: string;
        id: string;
        nombre: string | null;
        cui: string | null;
        fechaNacimiento: string | null;
      } = {
        tipo: "BENEFICIARIA",
        id: beneficiariaId,
        nombre: expedientes[0].nombre,
        cui: expedientes[0].cui,
        fechaNacimiento: expedientes[0].fechaNacimiento,
      };
      if (entrada.ninoId) {
        const ninos = await manager.query<
          Array<{
            id: string;
            nombre: string | null;
            cui: string | null;
            fechaNacimiento: string | null;
          }>
        >(
          `SELECT nino_id::text AS id,nombre,cui,fecha_nac AS "fechaNacimiento"
           FROM new_horizons.nino
           WHERE nino_id=$1::bigint AND expediente_id=$2::bigint`,
          [entrada.ninoId, expedientes[0].id],
        );
        if (!ninos[0]) return { estado: "NINO_NO_PERTENECE" as const };
        sujeto = { tipo: "NINO", ...ninos[0] };
      }

      const profesionales = await manager.query<Array<{ existe: boolean }>>(
        `SELECT EXISTS(SELECT 1 FROM new_horizons.empleado WHERE id_empleado=$1::bigint) AS existe`,
        [entrada.profesionalId],
      );
      if (!profesionales[0]?.existe)
        return { estado: "PROFESIONAL_NO_ENCONTRADO" as const };

      const creados = await manager.query<Array<{ id: string }>>(
        `INSERT INTO new_horizons.formulario_area(
           expediente_id,nino_id,area_id,tipo,estado_codigo,fecha_atencion,
           profesional_id,capturado_por,identidad_al_atender
         ) VALUES ($1::bigint,$2::bigint,$3::bigint,$4,$5,$6::timestamptz,
                   $7::bigint,$8::bigint,$9::jsonb)
         RETURNING id::text AS id`,
        [
          expedientes[0].id,
          entrada.ninoId ?? null,
          tipos[0].areaId,
          entrada.tipo,
          this.estadoBorrador,
          entrada.fechaAtencion,
          entrada.profesionalId,
          auditor.usuarioId,
          JSON.stringify(sujeto),
        ],
      );
      await this.insertarDetalle(
        manager,
        creados[0].id,
        entrada.tipo as CodigoTipoFormulario,
        entrada.detalle,
      );
      if (entrada.examenMental)
        await this.insertarExamenMental(
          manager,
          creados[0].id,
          entrada.examenMental,
        );
      return {
        estado: "CREADO" as const,
        formulario: await this.obtener(creados[0].id, manager),
      };
    });
  }

  private async actualizarObjeto(
    manager: EntityManager,
    tabla: string,
    formularioId: string,
    valores: Record<string, unknown>,
    insertarSiNoExiste = false,
  ) {
    const entradas = Object.entries(valores);
    if (!entradas.length) return;
    const asignaciones = entradas.map(
      ([campo], indice) => `${aSnakeCase(campo)}=$${indice + 2}`,
    );
    const parametros = [formularioId, ...entradas.map(([, valor]) => valor)];
    const resultado = await manager.query(
      `UPDATE new_horizons.${tabla} SET ${asignaciones.join(",")}
       WHERE formulario_id=$1::bigint`,
      parametros,
    );
    if (insertarSiNoExiste && resultado[1] === 0) {
      const columnas = entradas.map(([campo]) => aSnakeCase(campo));
      const nombres = ["formulario_id", ...columnas];
      const placeholders = nombres.map((_, indice) => `$${indice + 1}`);
      await manager.query(
        `INSERT INTO new_horizons.${tabla} (${nombres.join(",")})
         VALUES (${placeholders.join(",")})`,
        parametros,
      );
    }
  }

  async actualizar(id: string, entrada: ActualizarFormularioDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, entrada.motivo);
      const rows = await manager.query<
        Array<{ tipo: CodigoTipoFormulario; estado: string; version: number }>
      >(
        `SELECT tipo,estado_codigo AS estado,version
         FROM new_horizons.formulario_area WHERE id=$1::bigint FOR UPDATE`,
        [id],
      );
      if (!rows[0]) return { estado: "NO_ENCONTRADO" as const };
      if (rows[0].estado !== this.estadoBorrador)
        return { estado: "NO_ES_BORRADOR" as const };
      if (rows[0].version !== entrada.version)
        return { estado: "CONFLICTO_VERSION" as const };

      if (entrada.fechaAtencion || entrada.profesionalId) {
        if (entrada.profesionalId) {
          const existe = await manager.query<Array<{ existe: boolean }>>(
            `SELECT EXISTS(SELECT 1 FROM new_horizons.empleado WHERE id_empleado=$1::bigint) AS existe`,
            [entrada.profesionalId],
          );
          if (!existe[0]?.existe)
            return { estado: "PROFESIONAL_NO_ENCONTRADO" as const };
        }
        await manager.query(
          `UPDATE new_horizons.formulario_area SET
             fecha_atencion=coalesce($2::timestamptz,fecha_atencion),
             profesional_id=coalesce($3::bigint,profesional_id),
             motivo_cambio=$4
           WHERE id=$1::bigint`,
          [
            id,
            entrada.fechaAtencion ?? null,
            entrada.profesionalId ?? null,
            entrada.motivo,
          ],
        );
      }
      if (entrada.detalle)
        await this.actualizarObjeto(
          manager,
          TIPOS_FORMULARIO[rows[0].tipo].tabla,
          id,
          entrada.detalle,
        );
      if (entrada.examenMental)
        await this.actualizarObjeto(
          manager,
          "psicologia_examen_mental",
          id,
          entrada.examenMental,
          true,
        );
      return {
        estado: "ACTUALIZADO" as const,
        formulario: await this.obtener(id, manager),
      };
    });
  }

  async confirmar(id: string, version: number, motivo: string) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, motivo);
      if (!(await this.estadoExiste(manager, this.estadoConfirmado)))
        return { estado: "CATALOGO_ESTADO_NO_CONFIGURADO" as const };
      const rows = await manager.query<
        Array<{ estado: string; version: number }>
      >(
        `SELECT estado_codigo AS estado,version
         FROM new_horizons.formulario_area WHERE id=$1::bigint FOR UPDATE`,
        [id],
      );
      if (!rows[0]) return { estado: "NO_ENCONTRADO" as const };
      if (rows[0].estado !== this.estadoBorrador)
        return { estado: "YA_CONFIRMADO" as const };
      if (rows[0].version !== version)
        return { estado: "CONFLICTO_VERSION" as const };
      await manager.query(
        `UPDATE new_horizons.formulario_area
         SET estado_codigo=$2,motivo_cambio=$3 WHERE id=$1::bigint`,
        [id, this.estadoConfirmado, motivo],
      );
      return {
        estado: "CONFIRMADO" as const,
        formulario: await this.obtener(id, manager),
      };
    });
  }

  async tipos() {
    return this.dataSource.query<
      Array<{
        codigo: string;
        descripcion: string;
        areaId: string;
        area: string;
      }>
    >(
      `SELECT tf.codigo,tf.descripcion,tf.area_id::text AS "areaId",
              a.nombre_area AS area
       FROM new_horizons.tipo_formulario tf
       JOIN new_horizons.area a ON a.id_area=tf.area_id
       ORDER BY a.nombre_area,tf.codigo`,
    );
  }

  async estados() {
    return this.dataSource.query<
      Array<{ codigo: string; descripcion: string }>
    >(
      `SELECT codigo,descripcion FROM new_horizons.estado_formulario
       WHERE codigo IN ($1,$2) ORDER BY codigo`,
      [this.estadoBorrador, this.estadoConfirmado],
    );
  }

  configuracionEstados() {
    return {
      borrador: this.estadoBorrador,
      confirmado: this.estadoConfirmado,
    };
  }
}
