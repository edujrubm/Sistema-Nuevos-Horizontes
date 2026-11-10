import { Persona3Service } from "../persona3/persona3.service";
import { readFile, stat, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute } from "node:path";
import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { ErrorApi } from "../../common/errors/error-api";
import { validacionApi } from "../../common/errors/validacion";
import { Persona3Repository, camel } from "../persona3/persona3.repository";
import { AmbitoLocalService } from "../persona3/ambito-local.service";
import { FichaSocialDetalleDto } from "../formularios/social/dto/ficha-social.dto";
import { FichaLegalDetalleDto } from "../formularios/legal/dto/ficha-legal.dto";
import { FichaGuarderiaDetalleDto } from "../formularios/guarderia/dto/ficha-guarderia.dto";
import { DetalleReferenciaDto } from "../persona3/dto/contratos.dto";
import {
  DetalleLocalDto,
  RiesgosLocalDto,
  ResponsableLocalDto,
  AutorizacionesLocalDto,
  DocumentoLocalDto,
  CierreLocalDto,
} from "./laboratorio.dto";
const detalles = {
  SOCIAL: {
    table: "ficha_social",
    entity: "FichaSocial",
    dto: FichaSocialDetalleDto,
  },
  LEGAL: {
    table: "ficha_legal",
    entity: "FichaLegal",
    dto: FichaLegalDetalleDto,
  },
  GUARDERIA: {
    table: "ficha_guarderia",
    entity: "FichaGuarderia",
    dto: FichaGuarderiaDetalleDto,
  },
  REFERENCIA_LEGAL: {
    table: "referencia_legal",
    entity: "ReferenciaLegal",
    dto: DetalleReferenciaDto,
  },
} as const;
@Injectable()
export class LaboratorioService {
  constructor(
    readonly repo: Persona3Repository,
    readonly ambito: AmbitoLocalService,
    readonly persona3: Persona3Service,
  ) {}
  async form(
    id: string,
    m: EntityManager = this.repo.data.manager,
    lock = false,
  ) {
    this.ambito.area();
    const f = await this.repo.formulario(id, m, lock);
    if (!Object.hasOwn(detalles, f.tipo))
      throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const [area] = await m.query(
      "SELECT nombre_area FROM new_horizons.area WHERE id_area=$1",
      [f.area_id],
    );
    this.ambito.comprobar(area.nombre_area);
    return f;
  }
  async catalogos() {
    this.ambito.area();
    return {
      areaActual: this.ambito.area(),
      fichas: await this.repo.data.query(
        "SELECT f.id::text,f.tipo,e.beneficiaria_id::text AS \"beneficiariaId\",b.nombre FROM new_horizons.formulario_area f JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id JOIN new_horizons.beneficiaria b ON b.id_beneficiaria=e.beneficiaria_id JOIN new_horizons.area a ON a.id_area=f.area_id WHERE a.nombre_area=$1 AND f.tipo IN ('SOCIAL','LEGAL','REFERENCIA_LEGAL','GUARDERIA') ORDER BY f.id DESC LIMIT 100",
        [this.ambito.area()],
      ),
      riesgos: await this.repo.data.query(
        "SELECT id::text,codigo,nombre FROM new_horizons.riesgo_social ORDER BY id",
      ),
      estadosDocumento: await this.repo.data.query(
        "SELECT * FROM new_horizons.estado_revision_documento ORDER BY codigo",
      ),
    };
  }
  async consultar(id: string, m = this.repo.data.manager) {
    const f = await this.form(id, m);
    const type = detalles[f.tipo as keyof typeof detalles];
    const [detail] = await m.query(
      `SELECT new_horizons.local_json_seguro(to_jsonb(d)) AS detalle FROM new_horizons.${type.table} d WHERE formulario_id=$1`,
      [id],
    );
    const riesgos =
      f.tipo === "SOCIAL"
        ? await m.query(
            "SELECT r.id::text,r.codigo,r.nombre FROM new_horizons.ficha_social_riesgo s JOIN new_horizons.riesgo_social r ON r.id=s.riesgo_social_id WHERE formulario_id=$1 AND seleccionado ORDER BY r.id",
            [id],
          )
        : [];
    const autorizaciones =
      f.tipo === "GUARDERIA"
        ? await m.query(
            'SELECT a.id::text,a.familiar_declarado_id::text AS "familiarId",a.puede_llevar AS "puedeLlevar",a.puede_recoger AS "puedeRecoger",p.nombre,p.cui,p.telefono FROM new_horizons.autorizacion_traslado_guarderia a JOIN new_horizons.familiar_declarado p ON p.id=a.familiar_declarado_id WHERE a.formulario_id=$1 AND a.activo ORDER BY a.id',
            [id],
          )
        : [];
    const documentos = await m.query(
      `SELECT id::text,coalesce(nombre_documento,categoria) AS "nombreDocumento",categoria,fecha_documento AS "fechaDocumento",descripcion,version_documento AS "versionDocumento",version_registro AS "versionRegistro",estado_revision_codigo AS "estadoRevisionCodigo",anulado_en AS "anuladoEn",NOT EXISTS(SELECT 1 FROM new_horizons.documento_area h WHERE h.documento_anterior_id=d.id AND h.anulado_en IS NULL) AND d.anulado_en IS NULL AND d.estado_revision_codigo='REVISADO' AS vigente FROM new_horizons.documento_area d WHERE formulario_id=$1 ORDER BY id`,
      [id],
    );
    return {
      familiares:
        f.tipo === "GUARDERIA"
          ? await m.query(
              "SELECT id::text,nombre,cui,telefono FROM new_horizons.familiar_declarado WHERE formulario_id=$1 ORDER BY id",
              [id],
            )
          : [],
      formulario: camel(f),
      detalle: camel(detail.detalle),
      riesgos,
      totalRiesgos: riesgos.length,
      autorizaciones,
      documentos,
    };
  }
  async guardar(id: string, dto: DetalleLocalDto) {
    const f = await this.form(id);
    const type = detalles[f.tipo as keyof typeof detalles];
    let detalle: Record<string, unknown>;
    try {
      detalle = await validacionApi().transform(dto.detalle, {
        type: "body",
        metatype: type.dto,
      });
    } catch (e) {
      if (e instanceof ErrorApi)
        throw new ErrorApi(
          e.codigo,
          e.errores.map((d) => ({
            campo: "detalle." + d.campo,
            mensaje: d.mensaje,
          })),
        );
      throw e;
    }
    const metadata = this.repo.data.getMetadata(type.entity);
    const pairs = Object.entries(detalle)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        const col = metadata.columns.find((c) => c.propertyName === k);
        if (!col || col.isPrimary) throw new ErrorApi("CAMPO_NO_PERMITIDO");
        return [col.databaseName, v] as const;
      });
    if (!pairs.length && !dto.fichaInicialId)
      throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
    return this.repo.transaction(dto.motivo, async (m) => {
      const current = await this.form(id, m, true);
      this.repo.version(current.version, dto.version);
      if (current.estado_codigo === "CERRADA")
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (
        current.tipo === "REFERENCIA_LEGAL" &&
        current.estado_codigo === process.env.P3_CONFIRMED_STATE
      ) {
        const row = await this.repo.referencia(id, m);
        this.persona3.validarReferenciaCompleta({
          ...(row.detalle as Record<string, unknown>),
          ...Object.fromEntries(
            Object.entries(detalle).filter(([, v]) => v !== undefined),
          ),
        });
      }
      if (pairs.length)
        await m.query(
          `UPDATE new_horizons.${type.table} SET ${pairs.map(([k], i) => `"${k}"=$${i + 2}`).join(",")} WHERE formulario_id=$1`,
          [id, ...pairs.map(([, v]) => v)],
        );
      if (dto.fichaInicialId)
        await m.query(
          "UPDATE new_horizons.formulario_area SET ficha_inicial_id=$2 WHERE id=$1",
          [id, dto.fichaInicialId],
        );
      return this.consultar(id, m);
    });
  }
  async riesgos(id: string, dto: RiesgosLocalDto) {
    return this.repo.transaction(dto.motivo, async (m) => {
      const f = await this.form(id, m, true);
      this.repo.version(f.version, dto.version);
      if (f.tipo !== "SOCIAL" || f.estado_codigo === "CERRADA")
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (dto.riesgosIds.some((v) => BigInt(v) > 9223372036854775807n))
        throw new ErrorApi("IDENTIFICADOR_INVALIDO");
      const found = await m.query(
        "SELECT id FROM new_horizons.riesgo_social WHERE id=ANY($1::bigint[])",
        [dto.riesgosIds],
      );
      if (found.length !== dto.riesgosIds.length)
        throw new ErrorApi("RELACION_INCOMPATIBLE");
      await m.query(
        "UPDATE new_horizons.ficha_social_riesgo SET seleccionado=false WHERE formulario_id=$1 AND seleccionado",
        [id],
      );
      for (const risk of dto.riesgosIds)
        await m.query(
          "INSERT INTO new_horizons.ficha_social_riesgo(formulario_id,riesgo_social_id) VALUES($1,$2) ON CONFLICT(formulario_id,riesgo_social_id) DO UPDATE SET seleccionado=true",
          [id, risk],
        );
      return this.consultar(id, m);
    });
  }
  async responsable(id: string, dto: ResponsableLocalDto) {
    return this.repo.transaction(dto.motivo, async (m) => {
      const f = await this.form(id, m, true);
      this.repo.version(f.version, dto.version);
      if (f.tipo !== "GUARDERIA") throw new ErrorApi("ESTADO_NO_PERMITIDO");
      const [p] = await m.query(
        "INSERT INTO new_horizons.familiar_declarado(formulario_id,vinculo,nombre,cui,telefono,parentesco_id) VALUES($1,'RESPONSABLE',$2,$3,$4,$5) RETURNING id::text,nombre",
        [
          id,
          dto.nombre.trim(),
          dto.cui ?? null,
          dto.telefono ?? null,
          dto.parentescoId ?? null,
        ],
      );
      // Familiar declarado no incrementaba la cabecera en el esquema original.
      await m.query(
        "UPDATE new_horizons.formulario_area SET motivo_cambio=$2 WHERE id=$1",
        [id, dto.motivo],
      );
      return { ...p, version: (await this.form(id, m)).version };
    });
  }
  async autorizaciones(id: string, dto: AutorizacionesLocalDto) {
    return this.repo.transaction(dto.motivo, async (m) => {
      const f = await this.form(id, m, true);
      this.repo.version(f.version, dto.version);
      if (f.tipo !== "GUARDERIA") throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (
        new Set(dto.autorizaciones.map((a) => a.familiarId)).size !==
        dto.autorizaciones.length
      )
        throw new ErrorApi("REGISTRO_DUPLICADO");
      for (const a of dto.autorizaciones) {
        if (!a.puedeLlevar && !a.puedeRecoger)
          throw new ErrorApi("DATOS_INVALIDOS");
        const [p] = await m.query(
          "SELECT id FROM new_horizons.familiar_declarado WHERE id=$1 AND formulario_id=$2",
          [a.familiarId, id],
        );
        if (!p) throw new ErrorApi("RELACION_INCOMPATIBLE");
      }
      await m.query(
        "UPDATE new_horizons.autorizacion_traslado_guarderia SET activo=false WHERE formulario_id=$1 AND activo",
        [id],
      );
      for (const a of dto.autorizaciones)
        await m.query(
          "INSERT INTO new_horizons.autorizacion_traslado_guarderia(formulario_id,familiar_declarado_id,puede_llevar,puede_recoger) VALUES($1,$2,$3,$4) ON CONFLICT(formulario_id,familiar_declarado_id) DO UPDATE SET puede_llevar=$3,puede_recoger=$4,activo=true",
          [id, a.familiarId, a.puedeLlevar, a.puedeRecoger],
        );
      return this.consultar(id, m);
    });
  }
  async cerrar(id: string, dto: CierreLocalDto) {
    return this.repo.transaction(dto.motivo, async (m) => {
      const f = await this.form(id, m, true);
      this.repo.version(f.version, dto.version);
      if (
        f.tipo !== "SOCIAL" ||
        f.estado_codigo !== process.env.P3_CONFIRMED_STATE
      )
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dto.fechaCierre) ||
        Number.isNaN(Date.parse(dto.fechaCierre))
      )
        throw new ErrorApi("FECHA_INVALIDA");
      const [check] = await m.query(
        "SELECT $1::date >= ($2::timestamptz AT TIME ZONE 'America/Guatemala')::date AS valida",
        [dto.fechaCierre, f.fecha_atencion],
      );
      if (!check.valida) throw new ErrorApi("FECHAS_INCOMPATIBLES");
      await m.query(
        "UPDATE new_horizons.ficha_social SET fecha_cierre=$2,resultados_alcanzados=$3 WHERE formulario_id=$1",
        [id, dto.fechaCierre, dto.resultadosAlcanzados],
      );
      await m.query(
        "UPDATE new_horizons.formulario_area SET estado_codigo='CERRADA',motivo_cambio=$2 WHERE id=$1",
        [id, dto.motivo],
      );
      return this.consultar(id, m);
    });
  }
  async documento(id: string, dto: DocumentoLocalDto) {
    if (dto.estadoRevisionCodigo === "REVISADO") await this.archivo(id);
    return this.repo.transaction(dto.motivo, async (m, actor) => {
      const [hint] = await m.query(
        "SELECT formulario_id FROM new_horizons.documento_area WHERE id=$1",
        [id],
      );
      if (!hint) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      await this.form(hint.formulario_id, m, true);
      const [doc] = await m.query(
        "SELECT * FROM new_horizons.documento_area WHERE id=$1 FOR UPDATE",
        [id],
      );
      this.repo.version(doc.version_registro, dto.version);
      if (doc.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
      const next = dto.estadoRevisionCodigo ?? doc.estado_revision_codigo;
      await m.query(
        "UPDATE new_horizons.documento_area SET nombre_documento=coalesce($2,nombre_documento),descripcion=coalesce($3,descripcion),estado_revision_codigo=$4,revisado_por=CASE WHEN $4='REVISADO' THEN $5::bigint ELSE NULL END,revisado_en=CASE WHEN $4='REVISADO' THEN clock_timestamp() ELSE NULL END WHERE id=$1",
        [id, dto.nombreDocumento ?? null, dto.descripcion ?? null, next, actor],
      );
      return this.consultar(doc.formulario_id, m);
    });
  }
  async archivo(id: string) {
    const [d] = await this.repo.data.query(
      "SELECT * FROM new_horizons.documento_area WHERE id=$1",
      [id],
    );
    if (!d) throw new ErrorApi("ARCHIVO_NO_ENCONTRADO");
    await this.form(d.formulario_id);
    if (d.anulado_en) throw new ErrorApi("DOCUMENTO_ANULADO");
    const root = resolve(
        process.env.P3_DOCUMENTS_DIR || "test-results/documentos-privados",
      ),
      file = resolve(root, d.objeto_privado),
      rel = relative(root, file);
    if (!rel || rel.startsWith("..") || isAbsolute(rel))
      throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
    let bytes: Buffer;
    try {
      const realRoot = await realpath(root),
        realFile = await realpath(file),
        realRel = relative(realRoot, realFile);
      if (!realRel || realRel.startsWith("..") || isAbsolute(realRel))
        throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
      const info = await stat(file);
      if (info.size !== Number(d.tamano_bytes) || info.size > 20 * 1024 * 1024)
        throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
      bytes = await readFile(file);
    } catch (e) {
      if (e instanceof ErrorApi) throw e;
      if ((e as NodeJS.ErrnoException).code === "ENOENT")
        throw new ErrorApi("ARCHIVO_NO_ENCONTRADO");
      throw new ErrorApi("ALMACENAMIENTO_NO_DISPONIBLE");
    }
    if (createHash("sha256").update(bytes).digest("hex") !== d.sha256)
      throw new ErrorApi("INTEGRIDAD_DOCUMENTO_NO_VERIFICADA");
    return bytes;
  }
}
