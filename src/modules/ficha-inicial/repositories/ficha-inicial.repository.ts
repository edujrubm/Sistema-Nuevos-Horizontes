import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";

import { CrearFichaDto } from "../dto/crear-ficha.dto";
import { CrearNinoFichaDto } from "../dto/crear-nino-ficha.dto";
import { ListarFichasDto } from "../dto/listar-fichas.dto";
import { FichaInicialEntity } from "../entities/ficha-inicial.entity";
import { FichaSeccionEntity } from "../entities/ficha-seccion.entity";

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

  async crear(beneficiariaId: string, entrada: CrearFichaDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.auditoria(manager, "Creación de borrador de ficha inicial");
      const expedientes = await manager.query<Array<{ id: string }>>(
        `SELECT id_expediente::text AS id FROM new_horizons.expediente WHERE beneficiaria_id=$1::bigint AND activo=true`,
        [beneficiariaId],
      );
      if (!expedientes[0]) return { estado: "SIN_EXPEDIENTE" as const };
      const repository = manager.getRepository(FichaInicialEntity);
      const existente = await repository.findOne({
        where: { expedienteId: expedientes[0].id, estado: "BORRADOR" },
      });
      if (existente)
        return { estado: "BORRADOR_EXISTENTE" as const, ficha: existente };
      const ficha = await repository.save(
        repository.create({
          expedienteId: expedientes[0].id,
          lugar: entrada.lugar?.trim() ?? null,
          fecha: new Date(),
        }),
      );
      return { estado: "CREADA" as const, ficha };
    });
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

  async agregarNino(id: string, entrada: CrearNinoFichaDto) {
    return this.dataSource
      .transaction(async (manager) => {
        await this.auditoria(
          manager,
          "Registro de hija o hijo desde ficha inicial",
        );
        const fichas = manager.getRepository(FichaInicialEntity);
        const ficha = await fichas.findOne({
          where: { id },
          lock: { mode: "pessimistic_write" },
        });
        if (!ficha) return { estado: "NO_ENCONTRADA" as const };
        if (ficha.estado !== "BORRADOR")
          return { estado: "CONFIRMADA" as const };
        if (entrada.cui) {
          const duplicado = await manager.query(
            `SELECT 1 FROM new_horizons.nino WHERE cui=$1 LIMIT 1`,
            [entrada.cui],
          );
          if (duplicado[0]) return { estado: "CUI_DUPLICADO" as const };
        }
        const rows = await manager.query<Array<Record<string, unknown>>>(
          `INSERT INTO new_horizons.nino(cui,nombre,fecha_nac,reconocido,genero,expediente_id)
         VALUES ($1,$2,$3::date,$4,$5,$6::bigint)
         RETURNING nino_id::text AS id,nombre,fecha_nac AS "fechaNacimiento",reconocido,genero,activo,version`,
          [
            entrada.cui?.trim() ?? null,
            entrada.nombre.trim(),
            entrada.fechaNacimiento ?? null,
            entrada.reconocido ?? null,
            entrada.genero ?? null,
            ficha.expedienteId,
          ],
        );
        return { estado: "CREADO" as const, nino: rows[0] };
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
}
