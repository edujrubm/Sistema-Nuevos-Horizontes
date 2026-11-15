import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { ErrorApi } from "../../../../common/errors/error-api";
import { auditedTransaction } from "../../../../common/database/audited-transaction";
import { ListaDto } from "../../../../common/dto/pagina.dto";
import { ExpedienteEntity } from "../../../beneficiarias";
import { NinoEntity } from "../../../ninos";
import { PadreNinoEntity } from "../entities/padre-nino.entity";
import {
  CrearPadreGuarderiaDto,
  EditarPadreGuarderiaDto,
} from "../dto/padre-guarderia.dto";

@Injectable()
export class GuarderiaPadresRepository {
  constructor(private readonly data: DataSource) {}
  /** La paternidad pertenece al niño, no a una versión de una ficha de área. */
  private async contexto(
    m: EntityManager,
    beneficiaria: string,
    nino: string,
    escritura = false,
  ) {
    const exp = await m
      .getRepository(ExpedienteEntity)
      .findOne({
        where: { beneficiariaId: beneficiaria },
        ...(escritura ? { lock: { mode: "pessimistic_read" as const } } : {}),
      });
    if (!exp) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    const hijo = await m
      .getRepository(NinoEntity)
      .findOne({
        where: { id: nino, expedienteId: exp.id },
        ...(escritura ? { lock: { mode: "pessimistic_read" as const } } : {}),
      });
    if (!hijo) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
    if (escritura && (!exp.activo || !hijo.activo))
      throw new ErrorApi("ESTADO_NO_PERMITIDO");
  }
  listar(beneficiaria: string, nino: string, filtro: ListaDto) {
    return this.data.transaction("REPEATABLE READ", async (m) => {
      await this.contexto(m, beneficiaria, nino);
      const [datos, total] = await m
        .getRepository(PadreNinoEntity)
        .findAndCount({
          where: { ninoId: nino },
          order: { id: "ASC" },
          skip: (filtro.pagina - 1) * filtro.limite,
          take: filtro.limite,
        });
      return { datos, total, pagina: filtro.pagina, limite: filtro.limite };
    });
  }
  private campos(dto: CrearPadreGuarderiaDto) {
    return Object.fromEntries(
      Object.entries({
        tipoVinculo: dto.tipoVinculo,
        nombre: dto.nombre,
        cui: dto.cui,
        telefono: dto.telefono,
        direccion: dto.direccion,
      }).filter(([, v]) => v !== undefined),
    );
  }
  crear(beneficiaria: string, nino: string, dto: CrearPadreGuarderiaDto) {
    return auditedTransaction(
      this.data,
      "Registro de paternidad desde Guardería",
      async (m) => {
        await this.contexto(m, beneficiaria, nino, true);
        const repo = m.getRepository(PadreNinoEntity);
        const row = await repo.save(
          repo.create({ ...this.campos(dto), ninoId: nino }),
        );
        return repo.findOneByOrFail({ id: row.id, ninoId: nino });
      },
    );
  }
  editar(
    beneficiaria: string,
    nino: string,
    id: string,
    dto: EditarPadreGuarderiaDto,
  ) {
    return auditedTransaction(this.data, dto.motivo, async (m) => {
      await this.contexto(m, beneficiaria, nino, true);
      const repo = m.getRepository(PadreNinoEntity);
      const row = await repo.findOne({
        where: { id, ninoId: nino },
        lock: { mode: "pessimistic_write" },
      });
      if (!row) throw new ErrorApi("REGISTRO_NO_ENCONTRADO");
      if (row.version !== dto.version)
        throw new ErrorApi("VERSION_DESACTUALIZADA");
      const campos = this.campos(dto);
      if (
        Object.entries(campos).every(
          ([k, v]) => row[k as keyof PadreNinoEntity] === v,
        )
      )
        throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
      await repo.update({ id, ninoId: nino, version: dto.version }, campos);
      return repo.findOneByOrFail({ id, ninoId: nino });
    });
  }
}
