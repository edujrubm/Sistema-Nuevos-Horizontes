import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import {
  CrearReferenciaDto,
  EditarReferenciaDto,
  TransicionDto,
} from "../../persona3/dto/contratos.dto";
import { validarReferenciaCompleta } from "../../persona3/validar-referencia";
import { FormularioAreaEntity } from "../shared/entities/formulario-area.entity";
import { ReferenciaLegal } from "./entities/referencia-legal.entity";
import {
  LegalFormType,
  LegalRepository,
} from "./repositories/legal.repository";

/** Consultas propias de Legal; las escrituras se migran en una entrega separada. */
@Injectable()
export class LegalService {
  constructor(private readonly repository: LegalRepository) {}

  private state(key: "P3_DRAFT_STATE" | "P3_CONFIRMED_STATE") {
    const state = process.env[key];
    if (!state) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    return state;
  }

  create(beneficiaryId: string, input: CrearReferenciaDto) {
    if (!input.detalle) throw new ErrorApi("DATOS_INVALIDOS");
    return this.repository.createReference(
      beneficiaryId,
      input,
      this.state("P3_DRAFT_STATE"),
    );
  }

  edit(id: string, input: EditarReferenciaDto) {
    const changes = Object.fromEntries(
      Object.entries(input.detalle || {}).filter(
        ([, value]) => value !== undefined,
      ),
    );
    if (!Object.keys(changes).length)
      throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
    return this.repository.changeReference(
      id,
      input.motivo,
      async (manager, header, detail) => {
        if (header.version !== input.version)
          throw new ErrorApi("VERSION_DESACTUALIZADA");
        const draft = this.state("P3_DRAFT_STATE"),
          confirmed = this.state("P3_CONFIRMED_STATE");
        if (![draft, confirmed].includes(header.estadoCodigo))
          throw new ErrorApi("ESTADO_NO_PERMITIDO");
        if (header.estadoCodigo === confirmed)
          validarReferenciaCompleta({ ...detail, ...changes });
        await manager
          .getRepository(ReferenciaLegal)
          .update({ formularioId: id }, changes);
      },
    );
  }

  confirm(id: string, input: TransicionDto) {
    return this.repository.changeReference(
      id,
      input.motivo,
      async (manager, header, detail) => {
        if (header.version !== input.version)
          throw new ErrorApi("VERSION_DESACTUALIZADA");
        const draft = this.state("P3_DRAFT_STATE"),
          confirmed = this.state("P3_CONFIRMED_STATE");
        if (header.estadoCodigo !== draft)
          throw new ErrorApi(
            header.estadoCodigo === confirmed
              ? "FORMULARIO_YA_CONFIRMADO"
              : "ESTADO_NO_PERMITIDO",
          );
        validarReferenciaCompleta({ ...detail });
        if (draft === confirmed) throw new ErrorApi("CONFIGURACION_INCOMPLETA");
        await manager
          .getRepository(FormularioAreaEntity)
          .update(
            { id },
            { estadoCodigo: confirmed, motivoCambio: input.motivo },
          );
      },
    );
  }

  reference(id: string) {
    return this.repository.reference(id);
  }

  list(
    beneficiaryId: string,
    type: LegalFormType,
    page: number,
    limit: number,
  ) {
    return this.repository.list(beneficiaryId, type, page, limit);
  }
}
