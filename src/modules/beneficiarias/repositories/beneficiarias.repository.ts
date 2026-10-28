import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";

import { ActualizarBeneficiariaDto } from "../dto/actualizar-beneficiaria.dto";
import { BuscarCoincidenciasDto } from "../dto/buscar-coincidencias.dto";
import { CambiarEstadoDto } from "../dto/cambiar-estado.dto";
import { CrearBeneficiariaDto } from "../dto/crear-beneficiaria.dto";
import { ListarBeneficiariasDto } from "../dto/listar-beneficiarias.dto";
import { BeneficiariaEntity } from "../entities/beneficiaria.entity";
import { ExpedienteEntity } from "../entities/expediente.entity";

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
        }),
      );
      const expediente = await manager.getRepository(ExpedienteEntity).save({
        beneficiariaId: beneficiaria.id,
      });
      return { conflictoCui: false as const, beneficiaria, expediente };
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
