import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorPublicoException } from "../../common/errors/error-publico.exception";
import { BeneficiariasService } from "../beneficiarias/beneficiarias.service";
import { IniciarFichaInicialDto } from "../beneficiarias/dto/crear-beneficiaria.dto";

import { ActualizarPaginaDto } from "./dto/actualizar-pagina.dto";
import { ActualizarSeccionDto } from "./dto/actualizar-seccion.dto";
import { ConfirmarFichaDto } from "./dto/confirmar-ficha.dto";
import { ListarFichasDto } from "./dto/listar-fichas.dto";
import {
  esPaginaFicha,
  esSeccionFicha,
  PAGINAS_FICHA,
  SECCIONES_FICHA,
} from "./ficha-inicial.constants";
import { FichaInicialRepository } from "./repositories/ficha-inicial.repository";

@Injectable()
export class FichaInicialService {
  constructor(
    private readonly repository: FichaInicialRepository,
    private readonly beneficiarias: BeneficiariasService,
  ) {}

  iniciar(entrada: IniciarFichaInicialDto) {
    return this.beneficiarias.crear(entrada);
  }

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

  async guardarPagina(
    id: string,
    pagina: string,
    entrada: ActualizarPaginaDto,
  ) {
    if (!esPaginaFicha(pagina))
      throw new BadRequestException({
        code: "INVALID_PAGE",
        message: "La página no pertenece a la ficha inicial.",
        allowed: Object.keys(PAGINAS_FICHA),
      });
    if (entrada.hijos?.length && pagina !== "familia")
      throw new ErrorPublicoException(
        400,
        "CAMPO_NO_PERMITIDO",
        "La solicitud contiene campos que esta operación no admite.",
        [
          {
            campo: "hijos",
            mensaje: "Las hijas e hijos solo se guardan en la página Familia.",
          },
        ],
      );
    const hijosInvalidos = (entrada.hijos ?? []).flatMap((hijo, indice) => {
      if (!hijo.id && !hijo.nombre)
        return [
          {
            campo: `hijos[${indice}].nombre`,
            mensaje: "Escribe el nombre para registrar a la hija o hijo.",
          },
        ];
      if (hijo.id && !hijo.version)
        return [
          {
            campo: `hijos[${indice}].version`,
            mensaje: "Consulta la versión vigente antes de guardar cambios.",
          },
        ];
      return [];
    });
    if (hijosInvalidos.length)
      throw new ErrorPublicoException(
        400,
        "DATOS_INVALIDOS",
        "Revisa los datos señalados antes de continuar.",
        hijosInvalidos,
      );

    const permitidas: readonly string[] = PAGINAS_FICHA[pagina];
    const recibidas = Object.keys(entrada.secciones);
    const invalidas = recibidas.filter(
      (seccion) => !permitidas.includes(seccion),
    );
    if (!recibidas.length || invalidas.length)
      throw new BadRequestException({
        code: "INVALID_PAGE_SECTIONS",
        message:
          "La página debe contener al menos una de sus secciones permitidas.",
        allowedSections: permitidas,
        invalidSections: invalidas,
      });

    const resultado = await this.repository.guardarPagina(
      id,
      entrada.secciones,
      entrada.hijos ?? [],
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
    if (resultado.estado === "HIJO_NO_ENCONTRADO")
      throw new ErrorPublicoException(
        404,
        "REGISTRO_NO_ENCONTRADO",
        "No se encontró el registro solicitado.",
      );
    if (resultado.estado === "HIJO_OTRO_EXPEDIENTE")
      throw new ErrorPublicoException(
        409,
        "RELACION_INCOMPATIBLE",
        "Los registros seleccionados no corresponden entre sí. Revisa tu selección.",
      );
    if (resultado.estado === "CONFLICTO_VERSION_HIJO")
      throw new ErrorPublicoException(
        409,
        "VERSION_DESACTUALIZADA",
        "Otra persona modificó este registro. Vuelve a consultarlo antes de guardar.",
      );
    if (resultado.estado === "CUI_DUPLICADO")
      throw new ErrorPublicoException(
        409,
        "REGISTRO_DUPLICADO",
        "Ya existe un registro con estos datos. Revisa el registro existente antes de continuar.",
      );
    return {
      data: {
        id: resultado.ficha.id,
        estado: resultado.ficha.estado,
        version: resultado.ficha.version,
        pagina,
        seccionesGuardadas: recibidas,
        hijos: resultado.hijos,
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
}
