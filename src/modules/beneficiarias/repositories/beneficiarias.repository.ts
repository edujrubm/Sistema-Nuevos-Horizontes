import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";

import { ActualizarBeneficiariaDto } from "../dto/actualizar-beneficiaria.dto";
import { BuscarCoincidenciasDto } from "../dto/buscar-coincidencias.dto";
import { CambiarEstadoDto } from "../dto/cambiar-estado.dto";
import { CrearBeneficiariaDto } from "../dto/crear-beneficiaria.dto";
import { CrearLugarOcupacionDto } from "../dto/crear-lugar-ocupacion.dto";
import { CrearResidenciaDto } from "../dto/crear-residencia.dto";
import { ListarBeneficiariasDto } from "../dto/listar-beneficiarias.dto";
import { BeneficiariaEntity } from "../entities/beneficiaria.entity";
import { ExpedienteEntity } from "../entities/expediente.entity";
import { FichaInicialEntity } from "../../ficha-inicial/entities/ficha-inicial.entity";

@Injectable()
export class BeneficiariasRepository {
  constructor(
    @InjectRepository(BeneficiariaEntity)
    private readonly repository: Repository<BeneficiariaEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async prepararAuditoria(manager: EntityManager, motivo: string) {
    const usuario = this.config.get<string>(
      "AUDIT_ACTOR_USERNAME",
      "actor_pruebas_persona1",
    );
    const filas = await manager.query<Array<{ id: string }>>(
      `SELECT id_usuario::text AS id FROM new_horizons.usuario
       WHERE nombre_usuario = $1`,
      [usuario],
    );
    if (!filas[0])
      throw new Error("No existe el actor técnico de auditoría configurado.");
    await manager.query(
      "SELECT set_config('new_horizons.actor_id', $1, true)",
      [filas[0].id],
    );
    await manager.query("SELECT set_config('new_horizons.motivo', $1, true)", [
      motivo,
    ]);
  }

  async listar(filtros: ListarBeneficiariasDto): Promise<BeneficiariaEntity[]> {
    const consulta = this.repository
      .createQueryBuilder("beneficiaria")
      .orderBy("beneficiaria.id_beneficiaria", "ASC")
      .take(filtros.limite + 1);

    if (filtros.cursor) {
      consulta.andWhere("beneficiaria.id_beneficiaria > :cursor", {
        cursor: filtros.cursor,
      });
    }
    if (filtros.nombre?.trim()) {
      consulta.andWhere("beneficiaria.nombre ILIKE :nombre", {
        nombre: `%${filtros.nombre.trim()}%`,
      });
    }
    return consulta.getMany();
  }

  buscarPorId(id: string): Promise<BeneficiariaEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async buscarDetallePorId(id: string) {
    const beneficiaria = await this.buscarPorId(id);
    if (!beneficiaria) return null;
    const [residencia] = beneficiaria.residenciaId
      ? await this.dataSource.query<Array<Record<string, unknown>>>(
          `SELECT r.id_residencia::text AS id,
                  r.direccion_actual AS "direccionActual", r.num_casa AS "numeroCasa",
                  r.num_celular AS "telefonoCelular",
                  r.direccion_alternativa AS "direccionAlternativa",
                  r.persona_enlace AS "personaEnlace",
                  r.relacion_persona_enlace AS "relacionPersonaEnlace",
                  r.urbano, r.pais_residencia_id::text AS "paisResidenciaId",
                  r.departamento_residencia_id::text AS "departamentoResidenciaId",
                  r.municipio_residencia_id::text AS "municipioResidenciaId",
                  CASE WHEN ar.id_area_residencial IS NULL THEN NULL ELSE
                    jsonb_build_object(
                      'id', ar.id_area_residencial::text, 'colonia', ar.colonia,
                      'barrioPopular', ar.barrio_popular, 'asentamiento', ar.asentamiento,
                      'zona', ar.zona, 'aldea', ar.aldea, 'caserio', ar.caserio,
                      'canton', ar.canton, 'otro', ar.otro
                    ) END AS "areaResidencial"
           FROM new_horizons.residencia r
           LEFT JOIN new_horizons.area_residencial ar
             ON ar.id_area_residencial = r.area_residencial_id
           WHERE r.id_residencia=$1::bigint`,
          [beneficiaria.residenciaId],
        )
      : [];
    const [lugarOcupacion] = beneficiaria.lugarOcupacionId
      ? await this.dataSource.query<Array<Record<string, unknown>>>(
          `SELECT lugar_ocupacion_id::text AS id, nombre, direccion, telefono,
                  persona_contacto AS "personaContacto",
                  cargo_persona_contacto AS "cargoPersonaContacto"
           FROM new_horizons.lugar_ocupacion
           WHERE lugar_ocupacion_id=$1::bigint`,
          [beneficiaria.lugarOcupacionId],
        )
      : [];
    const [expediente] = await this.dataSource.query<
      Array<Record<string, unknown>>
    >(
      `SELECT id_expediente::text AS id, activo, version
       FROM new_horizons.expediente WHERE beneficiaria_id=$1::bigint`,
      [id],
    );
    const [fichaInicial] = await this.dataSource.query<
      Array<Record<string, unknown>>
    >(
      `SELECT f.id_ficha_inicial::text AS id, f.correlativo_ficha AS correlativo,
              f.lugar, f.fecha, f.estado, f.version
       FROM new_horizons.ficha_inicial f
       JOIN new_horizons.expediente e ON e.id_expediente=f.expediente_id
       WHERE e.beneficiaria_id=$1::bigint
       ORDER BY (f.estado='BORRADOR') DESC, f.id_ficha_inicial DESC LIMIT 1`,
      [id],
    );
    return {
      beneficiaria,
      residencia,
      lugarOcupacion,
      expediente,
      fichaInicial,
    };
  }

  private async guardarAreaResidencial(
    manager: EntityManager,
    entrada: CrearResidenciaDto["areaResidencial"],
    actualId?: string | null,
  ) {
    if (!entrada) return actualId ?? null;
    const valores = [
      entrada.colonia ?? null,
      entrada.barrioPopular ?? null,
      entrada.asentamiento ?? null,
      entrada.zona ?? null,
      entrada.aldea ?? null,
      entrada.caserio ?? null,
      entrada.canton ?? null,
      entrada.otro ?? null,
    ];
    if (actualId) {
      await manager.query(
        `UPDATE new_horizons.area_residencial SET colonia=$2, barrio_popular=$3,
          asentamiento=$4, zona=$5, aldea=$6, caserio=$7, canton=$8, otro=$9
         WHERE id_area_residencial=$1::bigint`,
        [actualId, ...valores],
      );
      return actualId;
    }
    const [fila] = await manager.query<Array<{ id: string }>>(
      `INSERT INTO new_horizons.area_residencial
        (colonia,barrio_popular,asentamiento,zona,aldea,caserio,canton,otro)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id_area_residencial::text AS id`,
      valores,
    );
    return fila.id;
  }

  private async guardarResidencia(
    manager: EntityManager,
    entrada: CrearResidenciaDto | undefined,
    actualId?: string | null,
  ) {
    if (!entrada) return actualId ?? null;
    let areaActualId: string | null = null;
    if (actualId) {
      const [actual] = await manager.query<Array<{ areaId: string | null }>>(
        `SELECT area_residencial_id::text AS "areaId"
         FROM new_horizons.residencia WHERE id_residencia=$1::bigint`,
        [actualId],
      );
      areaActualId = actual?.areaId ?? null;
    }
    const areaId = await this.guardarAreaResidencial(
      manager,
      entrada.areaResidencial,
      areaActualId,
    );
    const valores = [
      entrada.direccionActual?.trim() ?? null,
      entrada.numeroCasa?.trim() ?? null,
      entrada.telefonoCelular?.trim() ?? null,
      entrada.direccionAlternativa?.trim() ?? null,
      entrada.personaEnlace?.trim() ?? null,
      entrada.relacionPersonaEnlace?.trim() ?? null,
      entrada.urbano ?? null,
      entrada.paisResidenciaId ?? null,
      entrada.departamentoResidenciaId ?? null,
      entrada.municipioResidenciaId ?? null,
      areaId,
    ];
    if (actualId) {
      await manager.query(
        `UPDATE new_horizons.residencia SET direccion_actual=$2, num_casa=$3,
          num_celular=$4, direccion_alternativa=$5, persona_enlace=$6,
          relacion_persona_enlace=$7, urbano=$8, pais_residencia_id=$9::bigint,
          departamento_residencia_id=$10::bigint, municipio_residencia_id=$11::bigint,
          area_residencial_id=$12::bigint WHERE id_residencia=$1::bigint`,
        [actualId, ...valores],
      );
      return actualId;
    }
    const [fila] = await manager.query<Array<{ id: string }>>(
      `INSERT INTO new_horizons.residencia
        (direccion_actual,num_casa,num_celular,direccion_alternativa,persona_enlace,
         relacion_persona_enlace,urbano,pais_residencia_id,departamento_residencia_id,
         municipio_residencia_id,area_residencial_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::bigint,$9::bigint,$10::bigint,$11::bigint)
       RETURNING id_residencia::text AS id`,
      valores,
    );
    return fila.id;
  }

  private async guardarLugarOcupacion(
    manager: EntityManager,
    entrada: CrearLugarOcupacionDto | undefined,
    actualId?: string | null,
  ) {
    if (!entrada) return actualId ?? null;
    const valores = [
      entrada.nombre?.trim() ?? null,
      entrada.direccion?.trim() ?? null,
      entrada.telefono?.trim() ?? null,
      entrada.personaContacto?.trim() ?? null,
      entrada.cargoPersonaContacto?.trim() ?? null,
    ];
    if (actualId) {
      await manager.query(
        `UPDATE new_horizons.lugar_ocupacion SET nombre=$2,direccion=$3,telefono=$4,
          persona_contacto=$5,cargo_persona_contacto=$6
         WHERE lugar_ocupacion_id=$1::bigint`,
        [actualId, ...valores],
      );
      return actualId;
    }
    const [fila] = await manager.query<Array<{ id: string }>>(
      `INSERT INTO new_horizons.lugar_ocupacion
        (nombre,direccion,telefono,persona_contacto,cargo_persona_contacto)
       VALUES ($1,$2,$3,$4,$5) RETURNING lugar_ocupacion_id::text AS id`,
      valores,
    );
    return fila.id;
  }

  async crear(entrada: CrearBeneficiariaDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, "Registro inicial de beneficiaria");
      const repositorio = manager.getRepository(BeneficiariaEntity);
      if (entrada.cui) {
        const duplicada = await repositorio.findOne({
          where: { cui: entrada.cui },
        });
        if (duplicada) return { conflictoCui: true as const };
      }
      const residenciaId = await this.guardarResidencia(
        manager,
        entrada.residencia,
      );
      const lugarOcupacionId = await this.guardarLugarOcupacion(
        manager,
        entrada.lugarOcupacion,
      );
      const beneficiaria = await repositorio.save(
        repositorio.create({
          nombre: entrada.nombre.trim(),
          cui: entrada.cui?.trim() ?? null,
          fechaNacimiento: entrada.fechaNacimiento ?? null,
          alfabetismo: entrada.alfabetismo ?? null,
          paisOrigenId: entrada.paisOrigenId ?? null,
          departamentoOrigenId: entrada.departamentoOrigenId ?? null,
          municipioOrigenId: entrada.municipioOrigenId ?? null,
          ocupacionId: entrada.ocupacionId ?? null,
          enfermedadPermanente: entrada.enfermedadPermanente ?? null,
          nombreEnfermedad: entrada.nombreEnfermedad?.trim() ?? null,
          tipoTratamiento: entrada.tipoTratamiento?.trim() ?? null,
          otrosPadecimientos: entrada.otrosPadecimientos?.trim() ?? null,
          paisCuiId: entrada.paisCuiId ?? null,
          tipoAcompananteId: entrada.tipoAcompananteId ?? null,
          lugarOcupacionId,
          estadoCivilId: entrada.estadoCivilId ?? null,
          nivelEstudioId: entrada.nivelEstudioId ?? null,
          residenciaId,
          estadoEstudioId: entrada.estadoEstudioId ?? null,
        }),
      );
      const expediente = await manager.getRepository(ExpedienteEntity).save({
        beneficiariaId: beneficiaria.id,
      });
      const fichaInicial = await manager
        .getRepository(FichaInicialEntity)
        .save({
          expedienteId: expediente.id,
          lugar: entrada.fichaInicial.lugar?.trim() ?? null,
          fecha: entrada.fichaInicial.fechaEntrevista
            ? new Date(`${entrada.fichaInicial.fechaEntrevista}T12:00:00.000Z`)
            : new Date(),
        });
      for (const [seccion, contenido] of Object.entries(
        entrada.fichaInicial.seccionesIniciales ?? {},
      )) {
        await manager.query(
          `INSERT INTO new_horizons.ficha_inicial_seccion
            (ficha_inicial_id,seccion,contenido) VALUES ($1::bigint,$2,$3::jsonb)`,
          [fichaInicial.id, seccion, JSON.stringify(contenido)],
        );
      }
      return {
        conflictoCui: false as const,
        beneficiaria,
        expediente,
        fichaInicial,
      };
    });
  }

  async actualizar(id: string, entrada: ActualizarBeneficiariaDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, entrada.motivo);
      const repositorio = manager.getRepository(BeneficiariaEntity);
      const beneficiaria = await repositorio.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!beneficiaria) return { estado: "NO_ENCONTRADA" as const };
      if (beneficiaria.version !== entrada.version) {
        return { estado: "CONFLICTO_VERSION" as const };
      }
      if (entrada.cui && entrada.cui !== beneficiaria.cui) {
        const duplicada = await repositorio.findOne({
          where: { cui: entrada.cui },
        });
        if (duplicada) return { estado: "CUI_DUPLICADO" as const };
      }
      const residenciaId = await this.guardarResidencia(
        manager,
        entrada.residencia,
        beneficiaria.residenciaId,
      );
      const lugarOcupacionId = await this.guardarLugarOcupacion(
        manager,
        entrada.lugarOcupacion,
        beneficiaria.lugarOcupacionId,
      );
      Object.assign(beneficiaria, {
        ...(entrada.nombre !== undefined && { nombre: entrada.nombre.trim() }),
        ...(entrada.cui !== undefined && { cui: entrada.cui.trim() }),
        ...(entrada.fechaNacimiento !== undefined && {
          fechaNacimiento: entrada.fechaNacimiento,
        }),
        ...(entrada.alfabetismo !== undefined && {
          alfabetismo: entrada.alfabetismo,
        }),
        ...(entrada.paisOrigenId !== undefined && {
          paisOrigenId: entrada.paisOrigenId,
        }),
        ...(entrada.departamentoOrigenId !== undefined && {
          departamentoOrigenId: entrada.departamentoOrigenId,
        }),
        ...(entrada.municipioOrigenId !== undefined && {
          municipioOrigenId: entrada.municipioOrigenId,
        }),
        ...(entrada.ocupacionId !== undefined && {
          ocupacionId: entrada.ocupacionId,
        }),
        ...(entrada.enfermedadPermanente !== undefined && {
          enfermedadPermanente: entrada.enfermedadPermanente,
        }),
        ...(entrada.nombreEnfermedad !== undefined && {
          nombreEnfermedad: entrada.nombreEnfermedad.trim(),
        }),
        ...(entrada.tipoTratamiento !== undefined && {
          tipoTratamiento: entrada.tipoTratamiento.trim(),
        }),
        ...(entrada.otrosPadecimientos !== undefined && {
          otrosPadecimientos: entrada.otrosPadecimientos.trim(),
        }),
        ...(entrada.paisCuiId !== undefined && {
          paisCuiId: entrada.paisCuiId,
        }),
        ...(entrada.tipoAcompananteId !== undefined && {
          tipoAcompananteId: entrada.tipoAcompananteId,
        }),
        ...(entrada.estadoCivilId !== undefined && {
          estadoCivilId: entrada.estadoCivilId,
        }),
        ...(entrada.nivelEstudioId !== undefined && {
          nivelEstudioId: entrada.nivelEstudioId,
        }),
        ...(entrada.estadoEstudioId !== undefined && {
          estadoEstudioId: entrada.estadoEstudioId,
        }),
        ...(entrada.residencia !== undefined && { residenciaId }),
        ...(entrada.lugarOcupacion !== undefined && { lugarOcupacionId }),
      });
      await repositorio.save(beneficiaria);
      return {
        estado: "ACTUALIZADA" as const,
        beneficiaria: await repositorio.findOneByOrFail({ id }),
      };
    });
  }

  async cambiarEstado(
    beneficiariaId: string,
    activo: boolean,
    entrada: CambiarEstadoDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, entrada.motivo);
      const repositorio = manager.getRepository(ExpedienteEntity);
      const expediente = await repositorio.findOne({
        where: { beneficiariaId },
        lock: { mode: "pessimistic_write" },
      });
      if (!expediente) return { estado: "NO_ENCONTRADA" as const };
      if (expediente.version !== entrada.version) {
        return { estado: "CONFLICTO_VERSION" as const };
      }
      if (expediente.activo === activo)
        return { estado: "SIN_CAMBIO" as const };
      expediente.activo = activo;
      expediente.inactivadoEn = activo ? null : new Date();
      expediente.motivoInactivacion = activo ? null : entrada.motivo;
      await repositorio.save(expediente);
      return {
        estado: "ACTUALIZADA" as const,
        expediente: await repositorio.findOneByOrFail({ beneficiariaId }),
      };
    });
  }

  async historial(beneficiariaId: string) {
    return this.dataSource.query<
      Array<{
        id: string;
        recurso: string;
        operacion: string;
        motivo: string | null;
        registradoEn: Date;
      }>
    >(
      `SELECT r.id::text AS id, r.tabla AS recurso, r.operacion,
              r.motivo, r.registrado_en AS "registradoEn"
       FROM new_horizons.revision_registro r
       WHERE (r.tabla = 'beneficiaria' AND r.registro_id = $1)
          OR (r.tabla = 'expediente' AND r.registro_id = (
                SELECT id_expediente::text FROM new_horizons.expediente
                WHERE beneficiaria_id = $1::bigint
              ))
       ORDER BY r.registrado_en DESC, r.id DESC`,
      [beneficiariaId],
    );
  }

  async buscarCoincidencias(
    filtros: BuscarCoincidenciasDto,
  ): Promise<BeneficiariaEntity[]> {
    const consulta = this.repository
      .createQueryBuilder("beneficiaria")
      .orderBy("beneficiaria.id_beneficiaria", "ASC")
      .take(20);

    if (filtros.cui?.trim()) {
      consulta.andWhere(
        "regexp_replace(coalesce(beneficiaria.cui, ''), '[^0-9]', '', 'g') = :cui",
        {
          cui: filtros.cui.replace(/\D/g, ""),
        },
      );
    }
    if (filtros.nombre?.trim()) {
      consulta.andWhere("beneficiaria.nombre ILIKE :nombre", {
        nombre: `%${filtros.nombre.trim()}%`,
      });
    }
    if (filtros.fechaNacimiento) {
      consulta.andWhere("beneficiaria.fecha_nac = :fechaNacimiento", {
        fechaNacimiento: filtros.fechaNacimiento,
      });
    }
    return consulta.getMany();
  }
}
