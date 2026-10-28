import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ActualizarSeccionDto } from "./dto/actualizar-seccion.dto";
import { ConfirmarFichaDto } from "./dto/confirmar-ficha.dto";
import { CrearFichaDto } from "./dto/crear-ficha.dto";
import { CrearNinoFichaDto } from "./dto/crear-nino-ficha.dto";
import { ListarFichasDto } from "./dto/listar-fichas.dto";
import { esSeccionFicha, SECCIONES_FICHA } from "./ficha-inicial.constants";
import { FichaInicialRepository } from "./repositories/ficha-inicial.repository";

@Injectable()
export class FichaInicialService {
  constructor(private readonly repository: FichaInicialRepository) {}

  async listar(filtro: ListarFichasDto) {
    const filas = await this.repository.listar(filtro);
    const tieneMas = filas.length > filtro.limite;
    const data = filas.slice(0, filtro.limite);
    return {
      data,
      page: {
        nextCursor: tieneMas ? (data.at(-1)?.id ?? null) : null,
        hasMore: tieneMas,
      },
    };
  }

  async consultar(id: string) {
    const resultado = await this.repository.obtener(id);
    if (!resultado) throw new NotFoundException("Ficha inicial no encontrada.");
    return { data: { ...resultado.ficha, secciones: resultado.secciones } };
  }

  async crear(beneficiariaId: string, entrada: CrearFichaDto) {
    const resultado = await this.repository.crear(beneficiariaId, entrada);
    if (resultado.estado === "SIN_EXPEDIENTE")
      throw new NotFoundException(
        "No existe un expediente activo para la beneficiaria.",
      );
    if (resultado.estado === "BORRADOR_EXISTENTE")
      throw new ConflictException({
        code: "DRAFT_EXISTS",
        message: "Ya existe un borrador para este expediente.",
        fichaId: resultado.ficha.id,
      });
    return { data: resultado.ficha };
  }

  async guardarSeccion(
    id: string,
    seccion: string,
    entrada: ActualizarSeccionDto,
  ) {
    if (!esSeccionFicha(seccion))
      throw new BadRequestException({
        code: "INVALID_SECTION",
        message: "La sección no pertenece a la ficha inicial.",
        allowed: SECCIONES_FICHA,
      });
    const resultado = await this.repository.guardarSeccion(
      id,
      seccion,
      entrada.contenido,
      entrada.versionFicha,
      entrada.motivo,
    );
    if (resultado.estado === "NO_ENCONTRADA")
      throw new NotFoundException("Ficha inicial no encontrada.");
    if (resultado.estado === "CONFIRMADA")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "Una ficha confirmada no puede editarse por este flujo.",
      });
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "La ficha cambió desde que fue consultada.",
      });
    return {
      data: {
        id: resultado.ficha.id,
        estado: resultado.ficha.estado,
        version: resultado.ficha.version,
        seccion,
      },
    };
  }

  async confirmar(id: string, entrada: ConfirmarFichaDto) {
    const resultado = await this.repository.confirmar(
      id,
      entrada.version,
      entrada.motivo,
      SECCIONES_FICHA,
    );
    if (resultado.estado === "NO_ENCONTRADA")
      throw new NotFoundException("Ficha inicial no encontrada.");
    if (resultado.estado === "YA_CONFIRMADA")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "La ficha ya fue confirmada.",
      });
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "La ficha cambió desde que fue consultada.",
      });
    if (resultado.estado === "INCOMPLETA")
      throw new BadRequestException({
        code: "INCOMPLETE_INITIAL_INTAKE",
        message: "Faltan secciones obligatorias.",
        missingSections: resultado.faltantes,
      });
    return { data: resultado.ficha };
  }

  async agregarNino(id: string, entrada: CrearNinoFichaDto) {
    const resultado = await this.repository.agregarNino(id, entrada);
    if (resultado.estado === "NO_ENCONTRADA")
      throw new NotFoundException("Ficha inicial no encontrada.");
    if (resultado.estado === "CONFIRMADA")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "No se pueden agregar hijos a una ficha confirmada.",
      });
    if (resultado.estado === "CUI_DUPLICADO")
      throw new ConflictException({
        code: "DUPLICATE_CUI",
        message: "El CUI ya está registrado.",
      });
    return { data: resultado.nino };
  }
}
