import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ActualizarNinoDto } from "./dto/actualizar-nino.dto";
import { CambiarEstadoNinoDto } from "./dto/cambiar-estado-nino.dto";
import { NinoEntity } from "./entities/nino.entity";
import { NinosRepository } from "./repositories/ninos.repository";

function respuesta(nino: NinoEntity) {
  const cui = nino.cui
    ? `${"*".repeat(Math.max(0, nino.cui.length - 4))}${nino.cui.slice(-4)}`
    : null;
  return {
    id: nino.id,
    nombre: nino.nombre,
    cuiEnmascarado: cui,
    fechaNacimiento: nino.fechaNacimiento,
    reconocido: nino.reconocido,
    genero: nino.genero,
    activo: nino.activo,
    version: nino.version,
  };
}

@Injectable()
export class NinosService {
  constructor(private readonly repository: NinosRepository) {}

  async listar(beneficiariaId: string) {
    return {
      data: (await this.repository.listarPorBeneficiaria(beneficiariaId)).map(
        respuesta,
      ),
    };
  }

  async consultar(id: string) {
    const nino = await this.repository.buscarPorId(id);
    if (!nino) throw new NotFoundException("Hija o hijo no encontrado.");
    return { data: respuesta(nino) };
  }

  async actualizar(id: string, entrada: ActualizarNinoDto) {
    const resultado = await this.repository.actualizar(id, entrada);
    if (resultado.estado === "NO_ENCONTRADO")
      throw new NotFoundException("Hija o hijo no encontrado.");
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El registro cambió desde que fue consultado.",
      });
    if (resultado.estado === "CUI_DUPLICADO")
      throw new ConflictException({
        code: "DUPLICATE_CUI",
        message: "El CUI ya está registrado.",
      });
    return { data: respuesta(resultado.nino) };
  }

  async cambiarEstado(
    id: string,
    activo: boolean,
    entrada: CambiarEstadoNinoDto,
  ) {
    const resultado = await this.repository.cambiarEstado(id, activo, entrada);
    if (resultado.estado === "NO_ENCONTRADO")
      throw new NotFoundException("Hija o hijo no encontrado.");
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El registro cambió desde que fue consultado.",
      });
    if (resultado.estado === "SIN_CAMBIO")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: activo
          ? "El registro ya está activo."
          : "El registro ya está inactivo.",
      });
    return { data: respuesta(resultado.nino) };
  }
}
