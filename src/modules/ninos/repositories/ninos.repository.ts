import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";

import { ActualizarNinoDto } from "../dto/actualizar-nino.dto";
import { CambiarEstadoNinoDto } from "../dto/cambiar-estado-nino.dto";
import { NinoEntity } from "../entities/nino.entity";

@Injectable()
export class NinosRepository {
  constructor(
    @InjectRepository(NinoEntity)
    private readonly repository: Repository<NinoEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private async prepararAuditoria(manager: EntityManager, motivo: string) {
    const nombre = this.config.get<string>(
      "AUDIT_ACTOR_USERNAME",
      "actor_pruebas_persona1",
    );
    const usuarios = await manager.query<Array<{ id: string }>>(
      `SELECT id_usuario::text AS id FROM new_horizons.usuario WHERE nombre_usuario = $1`,
      [nombre],
    );
    if (!usuarios[0])
      throw new Error("No existe el actor técnico de auditoría configurado.");
    await manager.query(
      "SELECT set_config('new_horizons.actor_id', $1, true)",
      [usuarios[0].id],
    );
    await manager.query("SELECT set_config('new_horizons.motivo', $1, true)", [
      motivo,
    ]);
  }

  listarPorBeneficiaria(beneficiariaId: string) {
    return this.repository
      .createQueryBuilder("nino")
      .where(
        `EXISTS (
          SELECT 1 FROM new_horizons.expediente expediente
          WHERE expediente.id_expediente = nino.expediente_id
            AND expediente.beneficiaria_id = :beneficiariaId
        )`,
        { beneficiariaId },
      )
      .orderBy("nino.nino_id", "ASC")
      .getMany();
  }

  buscarPorId(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async actualizar(id: string, entrada: ActualizarNinoDto) {
    return this.dataSource
      .transaction(async (manager) => {
        await this.prepararAuditoria(manager, entrada.motivo);
        const repository = manager.getRepository(NinoEntity);
        const nino = await repository.findOne({
          where: { id },
          lock: { mode: "pessimistic_write" },
        });
        if (!nino) return { estado: "NO_ENCONTRADO" as const };
        if (nino.version !== entrada.version)
          return { estado: "CONFLICTO_VERSION" as const };
        if (entrada.cui && entrada.cui !== nino.cui) {
          const duplicado = await repository.findOne({
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
        await repository.save(nino);
        return {
          estado: "ACTUALIZADO" as const,
          nino: await repository.findOneByOrFail({ id }),
        };
      })
      .catch((error: unknown) => {
        if (
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string }).code === "23505"
        ) {
          return { estado: "CUI_DUPLICADO" as const };
        }
        throw error;
      });
  }

  async cambiarEstado(
    id: string,
    activo: boolean,
    entrada: CambiarEstadoNinoDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.prepararAuditoria(manager, entrada.motivo);
      const repository = manager.getRepository(NinoEntity);
      const nino = await repository.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!nino) return { estado: "NO_ENCONTRADO" as const };
      if (nino.version !== entrada.version)
        return { estado: "CONFLICTO_VERSION" as const };
      if (nino.activo === activo) return { estado: "SIN_CAMBIO" as const };
      nino.activo = activo;
      nino.inactivadoEn = activo ? null : new Date();
      nino.motivoInactivacion = activo ? null : entrada.motivo;
      await repository.save(nino);
      return {
        estado: "ACTUALIZADO" as const,
        nino: await repository.findOneByOrFail({ id }),
      };
    });
  }
}
