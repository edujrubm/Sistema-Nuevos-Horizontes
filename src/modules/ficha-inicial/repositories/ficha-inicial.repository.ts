import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";

import { GuardarHijoPaginaDto } from "../dto/actualizar-pagina.dto";
import { ListarFichasDto } from "../dto/listar-fichas.dto";
import { FichaInicialEntity } from "../entities/ficha-inicial.entity";
import { FichaSeccionEntity } from "../entities/ficha-seccion.entity";
import { NinoEntity } from "../../ninos/entities/nino.entity";

@Injectable()
export class FichaInicialRepository {
  constructor(
    @InjectRepository(FichaInicialEntity)
    private readonly fichas: Repository<FichaInicialEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async auditoria(manager: EntityManager, motivo: string) {
    const username = this.config.get<string>(
      "AUDIT_ACTOR_USERNAME",
      "actor_pruebas_persona1",
    );
    const rows = await manager.query<Array<{ id: string }>>(
      `SELECT id_usuario::text AS id FROM new_horizons.usuario WHERE nombre_usuario=$1`,
      [username],
    );
    if (!rows[0])
      throw new Error("No existe el actor técnico de auditoría configurado.");
    await manager.query("SELECT set_config('new_horizons.actor_id',$1,true)", [
      rows[0].id,
    ]);
    await manager.query("SELECT set_config('new_horizons.motivo',$1,true)", [
      motivo,
    ]);
  }

  async listar(filtro: ListarFichasDto) {
    const query = this.fichas
      .createQueryBuilder("ficha")
      .orderBy("ficha.id_ficha_inicial", "ASC")
      .take(filtro.limite + 1);
    if (filtro.cursor)
      query.andWhere("ficha.id_ficha_inicial > :cursor", {
        cursor: filtro.cursor,
      });
    if (filtro.estado)
      query.andWhere("ficha.estado = :estado", { estado: filtro.estado });
    return query.getMany();
  }

  async obtener(id: string) {
    const ficha = await this.fichas.findOne({ where: { id } });
    if (!ficha) return null;
    const secciones = await this.dataSource
      .getRepository(FichaSeccionEntity)
      .find({ where: { fichaInicialId: id }, order: { seccion: "ASC" } });
    return { ficha, secciones };
  }

  async guardarSeccion(
    id: string,
    seccion: string,
    contenido: Record<string, unknown>,
    version: number,
    motivo: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.auditoria(manager, motivo);
      const fichas = manager.getRepository(FichaInicialEntity);
      const ficha = await fichas.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!ficha) return { estado: "NO_ENCONTRADA" as const };
      if (ficha.estado !== "BORRADOR") return { estado: "CONFIRMADA" as const };
      if (ficha.version !== version)
        return { estado: "CONFLICTO_VERSION" as const };
      await manager.query(
        `INSERT INTO new_horizons.ficha_inicial_seccion(ficha_inicial_id,seccion,contenido)
         VALUES ($1::bigint,$2,$3::jsonb)
         ON CONFLICT (ficha_inicial_id,seccion) DO UPDATE SET contenido=EXCLUDED.contenido`,
        [id, seccion, JSON.stringify(contenido)],
      );
      await fichas.update({ id }, { actualizadoEn: new Date() });
      return {
        estado: "ACTUALIZADA" as const,
        ficha: await fichas.findOneByOrFail({ id }),
      };
    });
  }

  async guardarPagina(
    id: string,
    pagina: string,
    secciones: Record<string, Record<string, unknown>>,
    hijos: GuardarHijoPaginaDto[],
    version: number,
    motivo: string,
  ) {
    return this.dataSource
      .transaction(async (manager) => {
        await this.auditoria(manager, motivo);
        const fichas = manager.getRepository(FichaInicialEntity);
        const ficha = await fichas.findOne({
          where: { id },
          lock: { mode: "pessimistic_write" },
        });
        if (!ficha) return { estado: "NO_ENCONTRADA" as const };
        if (ficha.estado !== "BORRADOR")
          return { estado: "CONFIRMADA" as const };
        if (ficha.version !== version)
          return { estado: "CONFLICTO_VERSION" as const };

        const seccionesSinDuplicados = await this.aplicarDatosEstructurados(
          manager,
          ficha,
          pagina,
          secciones,
        );

        const ninos = manager.getRepository(NinoEntity);
        const hijosGuardados: NinoEntity[] = [];
        for (const entrada of hijos) {
          if (entrada.id) {
            const nino = await ninos.findOne({
              where: { id: entrada.id },
              lock: { mode: "pessimistic_write" },
            });
            if (!nino) return { estado: "HIJO_NO_ENCONTRADO" as const };
            if (nino.expedienteId !== ficha.expedienteId)
              return { estado: "HIJO_OTRO_EXPEDIENTE" as const };
            if (nino.version !== entrada.version)
              return { estado: "CONFLICTO_VERSION_HIJO" as const };
            if (entrada.cui && entrada.cui !== nino.cui) {
              const duplicado = await ninos.findOne({
                where: { cui: entrada.cui },
              });
              if (duplicado) return { estado: "CUI_DUPLICADO" as const };
            }
            Object.assign(nino, {
              ...(entrada.nombre !== undefined && {
                nombre: entrada.nombre.trim(),
              }),
              ...(entrada.cui !== undefined && { cui: entrada.cui.trim() }),
              ...(entrada.fechaNacimiento !== undefined && {
                fechaNacimiento: entrada.fechaNacimiento,
              }),
              ...(entrada.reconocido !== undefined && {
                reconocido: entrada.reconocido,
              }),
              ...(entrada.genero !== undefined && { genero: entrada.genero }),
            });
            hijosGuardados.push(await ninos.save(nino));
            continue;
          }
          if (entrada.cui) {
            const duplicado = await ninos.findOne({
              where: { cui: entrada.cui },
            });
            if (duplicado) return { estado: "CUI_DUPLICADO" as const };
          }
          hijosGuardados.push(
            await ninos.save(
              ninos.create({
                expedienteId: ficha.expedienteId,
                nombre: entrada.nombre!.trim(),
                cui: entrada.cui?.trim() ?? null,
                fechaNacimiento: entrada.fechaNacimiento ?? null,
                reconocido: entrada.reconocido ?? null,
                genero: entrada.genero ?? null,
              }),
            ),
          );
        }

        for (const [seccion, contenido] of Object.entries(
          seccionesSinDuplicados,
        )) {
          await manager.query(
            `INSERT INTO new_horizons.ficha_inicial_seccion(ficha_inicial_id,seccion,contenido)
           VALUES ($1::bigint,$2,$3::jsonb)
           ON CONFLICT (ficha_inicial_id,seccion) DO UPDATE SET contenido=EXCLUDED.contenido`,
            [id, seccion, JSON.stringify(contenido)],
          );
        }
        await fichas.update({ id }, { actualizadoEn: new Date() });
        const hijosActualizados = await Promise.all(
          hijosGuardados.map((nino) => ninos.findOneByOrFail({ id: nino.id })),
        );
        return {
          estado: "ACTUALIZADA" as const,
          ficha: await fichas.findOneByOrFail({ id }),
          hijos: hijosActualizados.map((nino) => ({
            id: nino.id,
            nombre: nino.nombre,
            fechaNacimiento: nino.fechaNacimiento,
            reconocido: nino.reconocido,
            genero: nino.genero,
            activo: nino.activo,
            version: nino.version,
          })),
        };
      })
      .catch((error: unknown) => {
        if (error instanceof QueryFailedError) {
          const codigo = (error.driverError as { code?: string }).code;
          if (codigo === "23505") return { estado: "CUI_DUPLICADO" as const };
          if (codigo === "23503" || codigo === "23514")
            return { estado: "RELACION_INCOMPATIBLE" as const };
        }
        throw error;
      });
  }

  private async aplicarDatosEstructurados(
    manager: EntityManager,
    ficha: FichaInicialEntity,
    pagina: string,
    secciones: Record<string, Record<string, unknown>>,
  ) {
    const resultado = structuredClone(secciones);
    const [expediente] = await manager.query<Array<{ beneficiariaId: string }>>(
      `SELECT beneficiaria_id::text AS "beneficiariaId" FROM new_horizons.expediente WHERE id_expediente=$1::bigint`,
      [ficha.expedienteId],
    );
    if (!expediente) return resultado;
    const beneficiariaId = expediente.beneficiariaId;

    if (pagina === "identificacion") {
      const contenido = resultado.identificacion ?? {};
      const {
        nombreCompleto,
        cui,
        fechaNacimiento,
        paisEmisionId,
        paisOrigenId,
        departamentoOrigenId,
        municipioOrigenId,
        ...exclusivo
      } = contenido;
      await manager.query(
        `UPDATE new_horizons.beneficiaria SET nombre=COALESCE($2,nombre),cui=COALESCE($3,cui),fecha_nac=COALESCE($4::date,fecha_nac),pais_cui_id=COALESCE($5::bigint,pais_cui_id),pais_origen_id=COALESCE($6::bigint,pais_origen_id),departamento_origen_id=COALESCE($7::bigint,departamento_origen_id),municipio_origen_id=COALESCE($8::bigint,municipio_origen_id) WHERE id_beneficiaria=$1::bigint`,
        [
          beneficiariaId,
          nombreCompleto ?? null,
          cui ?? null,
          fechaNacimiento ?? null,
          paisEmisionId ?? null,
          paisOrigenId ?? null,
          departamentoOrigenId ?? null,
          municipioOrigenId ?? null,
        ],
      );
      resultado.identificacion = exclusivo;
    }

    if (pagina === "residencia") {
      const contenido = resultado.residencia ?? {};
      const persona = (contenido.personaEnlace ?? {}) as Record<
        string,
        unknown
      >;
      const {
        paisResidenciaId,
        departamentoResidenciaId,
        municipioResidenciaId,
        direccionActual,
        telefonoCelular,
        direccionAlternativa,
        areaResidencial,
        personaEnlace,
        ...exclusivo
      } = contenido;
      const [actual] = await manager.query<Array<{ id: string | null }>>(
        `SELECT residencia_id::text AS id FROM new_horizons.beneficiaria WHERE id_beneficiaria=$1::bigint`,
        [beneficiariaId],
      );
      let residenciaId = actual?.id;
      if (!residenciaId) {
        const [creada] = await manager.query<Array<{ id: string }>>(
          `INSERT INTO new_horizons.residencia DEFAULT VALUES RETURNING id_residencia::text AS id`,
        );
        residenciaId = creada.id;
        await manager.query(
          `UPDATE new_horizons.beneficiaria SET residencia_id=$2::bigint WHERE id_beneficiaria=$1::bigint`,
          [beneficiariaId, residenciaId],
        );
      }
      await manager.query(
        `UPDATE new_horizons.residencia SET direccion_actual=COALESCE($2,direccion_actual),num_celular=COALESCE($3,num_celular),direccion_alternativa=COALESCE($4,direccion_alternativa),persona_enlace=COALESCE($5,persona_enlace),relacion_persona_enlace=COALESCE($6,relacion_persona_enlace),urbano=COALESCE($7,urbano),pais_residencia_id=COALESCE($8::bigint,pais_residencia_id),departamento_residencia_id=COALESCE($9::bigint,departamento_residencia_id),municipio_residencia_id=COALESCE($10::bigint,municipio_residencia_id) WHERE id_residencia=$1::bigint`,
        [
          residenciaId,
          direccionActual ?? null,
          telefonoCelular ?? null,
          direccionAlternativa ?? null,
          persona.nombreCompleto ?? null,
          persona.relacion ?? null,
          areaResidencial === "URBANA"
            ? true
            : areaResidencial === "RURAL"
              ? false
              : null,
          paisResidenciaId ?? null,
          departamentoResidenciaId ?? null,
          municipioResidenciaId ?? null,
        ],
      );
      resultado.residencia = exclusivo;
    }

    if (pagina === "datos-salud") {
      const datos = resultado["datos-generales"] ?? {};
      const salud = resultado.salud ?? {};
      const {
        ocupacionId,
        estadoCivilId,
        nivelEstudioId,
        estadoEstudioId,
        alfabetismo,
        lugarTrabajoOEstudio,
        direccionTrabajoOEstudio,
        telefonoTrabajoOEstudio,
        contactoTrabajoOEstudio,
        ...datosExclusivos
      } = datos;
      const {
        enfermedadPermanente,
        nombreEnfermedad,
        tipoTratamiento,
        otrosPadecimientos,
        ...saludExclusiva
      } = salud;
      await manager.query(
        `UPDATE new_horizons.beneficiaria SET ocupacion_id=COALESCE($2::bigint,ocupacion_id),estado_civil_id=COALESCE($3::bigint,estado_civil_id),nivel_estudio_id=COALESCE($4::bigint,nivel_estudio_id),estado_estudio_id=COALESCE($5::bigint,estado_estudio_id),alfabetismo=COALESCE($6::boolean,alfabetismo),enfermedad_permanente=COALESCE($7::boolean,enfermedad_permanente),nombre_enfermedad=COALESCE($8,nombre_enfermedad),tipo_tratamiento=COALESCE($9,tipo_tratamiento),otros_padecimientos=COALESCE($10,otros_padecimientos) WHERE id_beneficiaria=$1::bigint`,
        [
          beneficiariaId,
          ocupacionId ?? null,
          estadoCivilId ?? null,
          nivelEstudioId ?? null,
          estadoEstudioId ?? null,
          typeof alfabetismo === "boolean" ? alfabetismo : null,
          typeof enfermedadPermanente === "boolean"
            ? enfermedadPermanente
            : null,
          nombreEnfermedad ?? null,
          tipoTratamiento ?? null,
          otrosPadecimientos ?? null,
        ],
      );
      if (lugarTrabajoOEstudio) {
        const contacto = (contactoTrabajoOEstudio ?? {}) as Record<
          string,
          unknown
        >;
        const [actual] = await manager.query<Array<{ id: string | null }>>(
          `SELECT lugar_ocupacion_id::text AS id FROM new_horizons.beneficiaria WHERE id_beneficiaria=$1::bigint`,
          [beneficiariaId],
        );
        const valores = [
          lugarTrabajoOEstudio,
          direccionTrabajoOEstudio ?? null,
          telefonoTrabajoOEstudio ?? null,
          contacto.nombreCompleto ?? null,
          contacto.cargo ?? null,
        ];
        if (actual?.id) {
          await manager.query(
            `UPDATE new_horizons.lugar_ocupacion SET nombre=$2,direccion=$3,telefono=$4,persona_contacto=$5,cargo_persona_contacto=$6 WHERE lugar_ocupacion_id=$1::bigint`,
            [actual.id, ...valores],
          );
        } else {
          const [lugar] = await manager.query<Array<{ id: string }>>(
            `INSERT INTO new_horizons.lugar_ocupacion(nombre,direccion,telefono,persona_contacto,cargo_persona_contacto) VALUES($1,$2,$3,$4,$5) RETURNING lugar_ocupacion_id::text AS id`,
            valores,
          );
          await manager.query(
            `UPDATE new_horizons.beneficiaria SET lugar_ocupacion_id=$2::bigint WHERE id_beneficiaria=$1::bigint`,
            [beneficiariaId, lugar.id],
          );
        }
      }
      resultado["datos-generales"] = datosExclusivos;
      resultado.salud = saludExclusiva;
    }
    return resultado;
  }

  async confirmar(
    id: string,
    version: number,
    motivo: string,
    seccionesRequeridas: readonly string[],
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.auditoria(manager, motivo);
      const repository = manager.getRepository(FichaInicialEntity);
      const ficha = await repository.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!ficha) return { estado: "NO_ENCONTRADA" as const };
      if (ficha.estado !== "BORRADOR")
        return { estado: "YA_CONFIRMADA" as const };
      if (ficha.version !== version)
        return { estado: "CONFLICTO_VERSION" as const };
      const rows = await manager.query<Array<{ seccion: string }>>(
        `SELECT seccion FROM new_horizons.ficha_inicial_seccion
         WHERE ficha_inicial_id=$1::bigint AND contenido <> '{}'::jsonb`,
        [id],
      );
      const presentes = new Set(rows.map((row) => row.seccion));
      const faltantes = seccionesRequeridas.filter(
        (seccion) => !presentes.has(seccion),
      );
      if (faltantes.length) return { estado: "INCOMPLETA" as const, faltantes };
      ficha.estado = "CONFIRMADA";
      ficha.confirmadaEn = new Date();
      await repository.save(ficha);
      return {
        estado: "CONFIRMADA" as const,
        ficha: await repository.findOneByOrFail({ id }),
      };
    });
  }
}
