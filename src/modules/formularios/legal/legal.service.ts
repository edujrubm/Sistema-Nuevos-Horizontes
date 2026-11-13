import { Injectable } from "@nestjs/common";
import { ErrorApi } from "../../../common/errors/error-api";
import {
  CrearReferenciaDto,
  DetalleReferenciaDto,
  EditarReferenciaDto,
} from "./dto/referencia-legal.dto";
import { TransicionDto } from "../../../common/dto/version.dto";
import { validarReferenciaCompleta } from "./validation/validar-referencia";
import { ConfigService } from "@nestjs/config";
import {
  LegalFormType,
  LegalRepository,
} from "./repositories/legal.repository";

/** Casos de uso de consultas y referencias del área Legal. */
@Injectable()
export class LegalService {
  constructor(
  private readonly repository: LegalRepository,
  private readonly config: ConfigService,
) {}

/** Usa la misma configuración de estados que el motor de formularios. */
private state(
  key: "FORM_DRAFT_STATE_CODE" | "FORM_CONFIRMED_STATE_CODE",
): string {
  const fallback =
    key === "FORM_DRAFT_STATE_CODE"
      ? "BORRADOR"
      : "CONFIRMADO";

  const state = this.config.get<string>(key, fallback);

  if (!state?.trim()) {
    throw new ErrorApi("CONFIGURACION_INCOMPLETA");
  }

  return state;
}

  create(beneficiaryId: string, input: CrearReferenciaDto) {
    if (!input.detalle) throw new ErrorApi("DATOS_INVALIDOS");
    return this.repository.createReference(
      beneficiaryId,
      input,
      this.state("FORM_DRAFT_STATE_CODE"),
    );
  }

  edit(id: string, input: EditarReferenciaDto) {
 const camposPermitidos = [
  "destino",
  "origen",
  "motivoReferencia",
  "recomendaciones",
  "medioEntrega",
] as const;

const changes: Partial<DetalleReferenciaDto> = {};

for (const campo of camposPermitidos) {
  const valor = input.detalle?.[campo];

  if (valor !== undefined) {
    changes[campo] = valor;
  }
}

  if (!Object.keys(changes).length) {
    throw new ErrorApi("SOLICITUD_SIN_CAMBIOS");
  }

  return this.repository.changeReference(
    id,
    input.motivo,
    (header, detail) => {
      if (header.version !== input.version) {
        throw new ErrorApi("VERSION_DESACTUALIZADA");
      }

      const draft = this.state("FORM_DRAFT_STATE_CODE");
      const confirmed = this.state("FORM_CONFIRMED_STATE_CODE");

      if (![draft, confirmed].includes(header.estadoCodigo)) {
        throw new ErrorApi("ESTADO_NO_PERMITIDO");
      }

      if (header.estadoCodigo === confirmed) {
        validarReferenciaCompleta({
          ...detail,
          ...changes,
        });
      }

      return {
        tipo: "EDITAR",
        detalle: changes,
      };
    },
  );
}

confirm(id: string, input: TransicionDto) {
  return this.repository.changeReference(
    id,
    input.motivo,
    (header, detail) => {
      if (header.version !== input.version) {
        throw new ErrorApi("VERSION_DESACTUALIZADA");
      }

      const draft = this.state("FORM_DRAFT_STATE_CODE");
      const confirmed = this.state("FORM_CONFIRMED_STATE_CODE");

      if (header.estadoCodigo !== draft) {
        throw new ErrorApi(
          header.estadoCodigo === confirmed
            ? "FORMULARIO_YA_CONFIRMADO"
            : "ESTADO_NO_PERMITIDO",
        );
      }

      validarReferenciaCompleta({ ...detail });

      if (draft === confirmed) {
        throw new ErrorApi("CONFIGURACION_INCOMPLETA");
      }

      return {
        tipo: "CONFIRMAR",
        estadoCodigo: confirmed,
      };
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
