import { ErrorApi, type ErrorCampo } from "../../../common/errors/error-api";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { ActualizarFormularioDto } from "./dto/actualizar-formulario.dto";
import { ConfirmarFormularioDto } from "./dto/confirmar-formulario.dto";
import { CrearFormularioDto } from "./dto/crear-formulario.dto";
import { DescartarFormularioDto } from "./dto/descartar-formulario.dto";
import { ListarFormulariosDto } from "./dto/listar-formularios.dto";
import { FormularioSharedRepository } from "./formulario-shared.repository";
import type { FormularioAreaRow } from "./contracts/formulario-area-row";
import {
  aCamelCase,
  CAMPOS_EXAMEN_MENTAL,
  CodigoTipoFormulario,
  DefinicionTipoFormulario,
  esCodigoTipoFormulario,
  TipoCampoFormulario,
  TIPOS_FORMULARIO,
} from "./formulario-tipos";

function transformarClaves(
  objeto: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!objeto) return null;
  return Object.fromEntries(
    Object.entries(objeto).map(([clave, valor]) => [aCamelCase(clave), valor]),
  );
}

function presentar(formulario: FormularioAreaRow | null) {
  if (!formulario) return null;
  return {
    ...formulario,
    detalle: transformarClaves(formulario.detalle),
    examenMental: transformarClaves(formulario.examenMental),
  };
}

@Injectable()
export class FormularioSharedService {
  constructor(private readonly repository: FormularioSharedRepository) {}

  private errorCatalogoEstado(): never {
    throw new ServiceUnavailableException({
      code: "FORM_STATE_CATALOG_NOT_CONFIGURED",
      message:
        "El catálogo de estados de formulario no contiene los códigos configurados.",
    });
  }

  private validarValor(
    campo: string,
    valor: unknown,
    tipo: TipoCampoFormulario,
  ) {
    if (valor === null) return;
    const nombreCampo = campo.split(".").at(-1) ?? campo;
    const numerosPositivos = new Set([
      "frecuenciaCardiacaLpm",
      "frecuenciaRespiratoriaRpm",
      "tallaCm",
      "pesoKg",
      "presionSistolicaMmhg",
      "presionDiastolicaMmhg",
    ]);
    const invalido = (() => {
      switch (tipo) {
        case "texto":
          return typeof valor !== "string";
        case "booleano":
          return typeof valor !== "boolean";
        case "entero":
          return (
            !Number.isInteger(valor) ||
            (valor as number) < 0 ||
            (nombreCampo === "ordenEntreHermanos" && valor === 0)
          );
        case "numero":
          return (
            typeof valor !== "number" ||
            !Number.isFinite(valor) ||
            (numerosPositivos.has(nombreCampo) && valor <= 0) ||
            (!numerosPositivos.has(nombreCampo) &&
              nombreCampo !== "temperaturaC" &&
              valor < 0) ||
            (nombreCampo === "horasSueno" && valor > 24)
          );
        case "id":
          return typeof valor !== "string" || !/^\d+$/.test(valor);
        case "fecha":
          return (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
            Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) ||
            new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) !== valor
          );
        case "instante":
          return typeof valor !== "string" || Number.isNaN(Date.parse(valor));
      }
    })();
    if (invalido)
      throw new ErrorApi("DATOS_INVALIDOS", [
        {
          campo,
          mensaje:
            tipo === "fecha"
              ? "Ingresa una fecha válida con el formato año-mes-día."
              : "Revisa el formato de este campo.",
        },
      ]);
  }

  private validarObjeto(
    objeto: Record<string, unknown>,
    permitidos: Readonly<Record<string, TipoCampoFormulario>>,
    nombre: string,
  ) {
    const errores: ErrorCampo[] = [];
    for (const [campo, valor] of Object.entries(objeto)) {
      const tipo = permitidos[campo];
      if (!tipo) {
        errores.push({
          campo: `${nombre}.${campo}`,
          mensaje: "Este campo no está permitido en este formulario.",
        });
        continue;
      }
      try {
        this.validarValor(`${nombre}.${campo}`, valor, tipo);
      } catch (error) {
        if (!(error instanceof ErrorApi)) throw error;
        errores.push(...error.errores);
      }
    }
    if (errores.length) throw new ErrorApi("DATOS_INVALIDOS", errores);
  }

  private definicion(tipo: string): DefinicionTipoFormulario {
    if (!esCodigoTipoFormulario(tipo))
      throw new BadRequestException({
        code: "INVALID_FORM_TYPE",
        message: "El tipo de formulario no es válido.",
        allowed: Object.keys(TIPOS_FORMULARIO),
      });
    return TIPOS_FORMULARIO[tipo];
  }

  private validarContenido(
    tipo: string,
    detalle: Record<string, unknown> | undefined,
    examenMental: Record<string, unknown> | undefined,
  ) {
    const definicion = this.definicion(tipo);
    if (detalle) this.validarObjeto(detalle, definicion.campos, "detalle");
    if (examenMental) {
      if (!definicion.admiteExamenMental)
        throw new BadRequestException({
          code: "MENTAL_EXAM_NOT_ALLOWED",
          message: "El examen mental solo corresponde a Psicología.",
        });
      this.validarObjeto(examenMental, CAMPOS_EXAMEN_MENTAL, "examenMental");
    }
    return definicion;
  }

  async listar(beneficiariaId: string, filtro: ListarFormulariosDto) {
    if (filtro.tipo) this.definicion(filtro.tipo);
    const filas = await this.repository.listar(beneficiariaId, filtro);
    const tieneMas = filas.length > filtro.limite;
    const data = filas.slice(0, filtro.limite);
    return {
      data: data.map(presentar),
      page: {
        nextCursor: tieneMas ? (data.at(-1)?.id ?? null) : null,
        hasMore: tieneMas,
      },
    };
  }

  async consultar(id: string) {
    const formulario = await this.repository.obtener(id);
    if (!formulario)
      throw new NotFoundException("Formulario de área no encontrado.");
    return { data: presentar(formulario) };
  }

  async crear(beneficiariaId: string, entrada: CrearFormularioDto) {
    const definicion = this.validarContenido(
      entrada.tipo,
      entrada.detalle,
      entrada.examenMental,
    );
    if (definicion.requiereNino !== Boolean(entrada.ninoId))
      throw new BadRequestException({
        code: "INVALID_FORM_SUBJECT",
        message: definicion.requiereNino
          ? "Esta variante requiere seleccionar una hija o hijo."
          : "Esta variante corresponde a la beneficiaria y no admite ninoId.",
      });

    const resultado = await this.repository.crear(beneficiariaId, entrada);
    if (resultado.estado === "CATALOGO_ESTADO_NO_CONFIGURADO")
      this.errorCatalogoEstado();
    if (resultado.estado === "TIPO_NO_ENCONTRADO")
      throw new BadRequestException({
        code: "INVALID_FORM_TYPE",
        message: "El tipo no está habilitado en el catálogo.",
      });
    if (resultado.estado === "SIN_EXPEDIENTE")
      throw new NotFoundException(
        "No existe un expediente activo para la beneficiaria.",
      );
    if (resultado.estado === "NINO_NO_PERTENECE")
      throw new BadRequestException({
        code: "CHILD_NOT_IN_CASE_FILE",
        message: "La hija o hijo no pertenece al expediente.",
      });
    if (resultado.estado === "PROFESIONAL_NO_ENCONTRADO")
      throw new ErrorApi("DATOS_INVALIDOS", [
        {
          campo: "profesionalId",
          mensaje:
            "El profesional seleccionado no existe. Usa su identificador interno registrado en el sistema.",
        },
      ]);
    if (resultado.formulario === undefined) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    return { data: presentar(resultado.formulario) };
  }

  async actualizar(id: string, entrada: ActualizarFormularioDto) {
    const tieneDetalle = Boolean(
      entrada.detalle && Object.keys(entrada.detalle).length,
    );
    const tieneExamen = Boolean(
      entrada.examenMental && Object.keys(entrada.examenMental).length,
    );
    if (
      !tieneDetalle &&
      !tieneExamen &&
      !entrada.fechaAtencion &&
      !entrada.profesionalId
    )
      throw new BadRequestException({
        code: "EMPTY_PATCH",
        message: "Debe indicar al menos un campo para actualizar.",
      });

    const actual = await this.repository.obtener(id);
    if (!actual)
      throw new NotFoundException("Formulario de área no encontrado.");
    this.validarContenido(actual.tipo, entrada.detalle, entrada.examenMental);
    const resultado = await this.repository.actualizar(id, entrada);
    if (resultado.estado === "NO_ENCONTRADO")
      throw new NotFoundException("Formulario de área no encontrado.");
    if (resultado.estado === "NO_ES_BORRADOR")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "Solo se puede actualizar un formulario en borrador.",
      });
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El formulario cambió desde que fue consultado.",
      });
    if (resultado.estado === "PROFESIONAL_NO_ENCONTRADO")
      throw new ErrorApi("DATOS_INVALIDOS", [
        {
          campo: "profesionalId",
          mensaje:
            "El profesional seleccionado no existe. Usa su identificador interno registrado en el sistema.",
        },
      ]);
    if (resultado.formulario === undefined) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    return { data: presentar(resultado.formulario) };
  }

  async confirmar(id: string, entrada: ConfirmarFormularioDto) {
    const resultado = await this.repository.confirmar(
      id,
      entrada.version,
      entrada.motivo,
    );
    if (resultado.estado === "CATALOGO_ESTADO_NO_CONFIGURADO")
      this.errorCatalogoEstado();
    if (resultado.estado === "NO_ENCONTRADO")
      throw new NotFoundException("Formulario de área no encontrado.");
    if (resultado.estado === "YA_CONFIRMADO")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "El formulario ya no está en borrador.",
      });
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El formulario cambió desde que fue consultado.",
      });
    if (resultado.formulario === undefined) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    return { data: presentar(resultado.formulario) };
  }

  async descartar(id: string, entrada: DescartarFormularioDto) {
    const resultado = await this.repository.descartar(
      id,
      entrada.version,
      entrada.motivo.trim(),
    );
    if (resultado.estado === "CATALOGO_ESTADO_NO_CONFIGURADO")
      this.errorCatalogoEstado();
    if (resultado.estado === "NO_ENCONTRADO")
      throw new NotFoundException("Formulario de área no encontrado.");
    if (resultado.estado === "NO_ES_BORRADOR")
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: "Solo se puede descartar un formulario en borrador.",
      });
    if (resultado.estado === "CONFLICTO_VERSION")
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El formulario cambió desde que fue consultado.",
      });
    if (resultado.formulario === undefined) {
      throw new ErrorApi("CONFIGURACION_INCOMPLETA");
    }
    return { data: presentar(resultado.formulario) };
  }

  async tipos() {
    const [filas, catalogoEstados] = await Promise.all([
      this.repository.tipos(),
      this.repository.estados(),
    ]);
    const codigosEstado = this.repository.configuracionEstados();
    const disponibles = new Set(catalogoEstados.map((estado) => estado.codigo));
    return {
      data: filas.map((fila) => {
        const codigo = fila.codigo as CodigoTipoFormulario;
        const definicion: DefinicionTipoFormulario | null =
          esCodigoTipoFormulario(codigo) ? TIPOS_FORMULARIO[codigo] : null;
        return {
          ...fila,
          detalle: definicion?.tabla ?? null,
          requiereNino: definicion?.requiereNino ?? null,
          admiteExamenMental: definicion?.admiteExamenMental ?? false,
          campos: definicion ? Object.keys(definicion.campos) : [],
        };
      }),
      estados: {
        codigos: codigosEstado,
        catalogo: catalogoEstados,
        listo:
          disponibles.has(codigosEstado.borrador) &&
          disponibles.has(codigosEstado.confirmado) &&
          disponibles.has(codigosEstado.descartado),
      },
    };
  }
}
