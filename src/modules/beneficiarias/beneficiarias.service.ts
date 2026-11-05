import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ErrorPublicoException } from "../../common/errors/error-publico.exception";

import { ActualizarBeneficiariaDto } from "./dto/actualizar-beneficiaria.dto";
import { BuscarCoincidenciasDto } from "./dto/buscar-coincidencias.dto";
import { CambiarEstadoDto } from "./dto/cambiar-estado.dto";
import { CrearBeneficiariaDto } from "./dto/crear-beneficiaria.dto";
import { ListarBeneficiariasDto } from "./dto/listar-beneficiarias.dto";
import { BeneficiariaEntity } from "./entities/beneficiaria.entity";
import { BeneficiariasRepository } from "./repositories/beneficiarias.repository";
import { esSeccionFicha } from "../ficha-inicial/ficha-inicial.constants";

function enmascararCui(cui: string | null): string | null {
  if (!cui) return null;
  const limpio = cui.replace(/\s/g, "");
  return `${"*".repeat(Math.max(0, limpio.length - 4))}${limpio.slice(-4)}`;
}

function resumen(beneficiaria: BeneficiariaEntity) {
  return {
    id: beneficiaria.id,
    nombre: beneficiaria.nombre,
    fechaNacimiento: beneficiaria.fechaNacimiento,
    cuiEnmascarado: enmascararCui(beneficiaria.cui),
  };
}

@Injectable()
export class BeneficiariasService {
  constructor(private readonly repository: BeneficiariasRepository) {}

  async listar(filtros: ListarBeneficiariasDto) {
    const filas = await this.repository.listar(filtros);
    const tieneMas = filas.length > filtros.limite;
    const pagina = filas.slice(0, filtros.limite);
    return {
      data: pagina.map(resumen),
      page: {
        nextCursor: tieneMas ? (pagina.at(-1)?.id ?? null) : null,
        hasMore: tieneMas,
      },
    };
  }

  async consultar(id: string) {
    const detalle = await this.repository.buscarDetallePorId(id);
    if (!detalle) {
      throw new NotFoundException("Beneficiaria no encontrada.");
    }
    const { cui, ...perfil } = detalle.beneficiaria;
    return {
      ...perfil,
      cuiEnmascarado: enmascararCui(cui),
      residencia: detalle.residencia ?? null,
      lugarOcupacion: detalle.lugarOcupacion ?? null,
      expediente: detalle.expediente ?? null,
      fichaInicial: detalle.fichaInicial ?? null,
    };
  }

  async buscarCoincidencias(filtros: BuscarCoincidenciasDto) {
    const filas = await this.repository.buscarCoincidencias(filtros);
    return { data: filas.map(resumen) };
  }

  async crear(entrada: CrearBeneficiariaDto) {
    this.validarEstructuraAdmision(entrada);
    const seccionesInvalidas = Object.keys(
      entrada.fichaInicial.seccionesIniciales ?? {},
    ).filter((seccion) => !esSeccionFicha(seccion));
    if (seccionesInvalidas.length) {
      throw new ErrorPublicoException(
        400,
        "DATOS_INVALIDOS",
        "Revisa los datos señalados antes de continuar.",
        seccionesInvalidas.map((seccion) => ({
          campo: `fichaInicial.seccionesIniciales.${seccion}`,
          mensaje: "Esta sección no pertenece a la ficha inicial.",
        })),
      );
    }
    const seccionesVacias = Object.entries(
      entrada.fichaInicial.seccionesIniciales ?? {},
    )
      .filter(
        ([, contenido]) =>
          !contenido ||
          typeof contenido !== "object" ||
          Array.isArray(contenido) ||
          Object.keys(contenido).length === 0,
      )
      .map(([seccion]) => seccion);
    if (seccionesVacias.length) {
      throw new ErrorPublicoException(
        400,
        "DATOS_INVALIDOS",
        "Revisa los datos señalados antes de continuar.",
        seccionesVacias.map((seccion) => ({
          campo: `fichaInicial.seccionesIniciales.${seccion}`,
          mensaje: "Completa al menos un dato de esta sección.",
        })),
      );
    }
    const referenciasInvalidas =
      await this.repository.validarReferencias(entrada);
    if (referenciasInvalidas.length) {
      throw new ErrorPublicoException(
        409,
        "RELACION_INCOMPATIBLE",
        "Los registros seleccionados no corresponden entre sí. Revisa tu selección.",
        referenciasInvalidas.map((campo) => ({
          campo,
          mensaje: "Selecciona un registro válido y compatible.",
        })),
      );
    }
    const resultado = await this.repository.crear(entrada);
    if (resultado.conflictoCui) {
      throw new ErrorPublicoException(
        409,
        "REGISTRO_DUPLICADO",
        "Ya existe un registro con estos datos. Revisa el registro existente antes de continuar.",
      );
    }
    if ("relacionIncompatible" in resultado) {
      throw new ErrorPublicoException(
        409,
        "RELACION_INCOMPATIBLE",
        "Los registros seleccionados no corresponden entre sí. Revisa tu selección.",
      );
    }
    const detalle = await this.repository.buscarDetallePorId(
      resultado.beneficiaria.id,
    );
    if (!detalle)
      throw new NotFoundException(
        "No fue posible recuperar la admisión creada.",
      );
    const { cui, ...perfil } = detalle.beneficiaria;
    return {
      data: {
        ...perfil,
        cuiEnmascarado: enmascararCui(cui),
        residencia: detalle.residencia ?? null,
        lugarOcupacion: detalle.lugarOcupacion ?? null,
        expediente: detalle.expediente,
        fichaInicial: detalle.fichaInicial,
      },
    };
  }

  private validarEstructuraAdmision(entrada: CrearBeneficiariaDto) {
    const errores: Array<{ campo: string; mensaje: string }> = [];
    const exigirPareja = (
      primero: string | undefined,
      campoPrimero: string,
      segundo: string | undefined,
      campoSegundo: string,
    ) => {
      if (primero && !segundo)
        errores.push({
          campo: campoSegundo,
          mensaje: "Selecciona este dato para completar la ubicación.",
        });
      if (!primero && segundo)
        errores.push({
          campo: campoPrimero,
          mensaje: "Selecciona este dato para completar la ubicación.",
        });
    };

    exigirPareja(
      entrada.paisOrigenId,
      "paisOrigenId",
      entrada.departamentoOrigenId,
      "departamentoOrigenId",
    );
    if (entrada.municipioOrigenId && !entrada.departamentoOrigenId)
      errores.push({
        campo: "departamentoOrigenId",
        mensaje: "Selecciona el departamento correspondiente al municipio.",
      });

    const residencia = entrada.residencia;
    if (residencia) {
      exigirPareja(
        residencia.paisResidenciaId,
        "residencia.paisResidenciaId",
        residencia.departamentoResidenciaId,
        "residencia.departamentoResidenciaId",
      );
      if (
        residencia.municipioResidenciaId &&
        !residencia.departamentoResidenciaId
      )
        errores.push({
          campo: "residencia.departamentoResidenciaId",
          mensaje: "Selecciona el departamento correspondiente al municipio.",
        });
      if (!this.tieneValor(residencia))
        errores.push({
          campo: "residencia",
          mensaje:
            "Ingresa al menos un dato de residencia o elimina este campo.",
        });
      if (
        residencia.areaResidencial &&
        !this.tieneValor(residencia.areaResidencial)
      )
        errores.push({
          campo: "residencia.areaResidencial",
          mensaje: "Ingresa al menos un dato del área residencial.",
        });
    }
    if (entrada.lugarOcupacion && !this.tieneValor(entrada.lugarOcupacion))
      errores.push({
        campo: "lugarOcupacion",
        mensaje: "Ingresa al menos un dato del lugar o elimina este campo.",
      });

    if (errores.length)
      throw new ErrorPublicoException(
        400,
        "DATOS_INVALIDOS",
        "Revisa los datos señalados antes de continuar.",
        errores,
      );
  }

  private tieneValor(objeto: object): boolean {
    return Object.values(objeto).some(
      (valor) =>
        valor !== undefined &&
        valor !== null &&
        valor !== "" &&
        (typeof valor !== "object" || this.tieneValor(valor)),
    );
  }

  async actualizar(id: string, entrada: ActualizarBeneficiariaDto) {
    const resultado = await this.repository.actualizar(id, entrada);
    if (resultado.estado === "NO_ENCONTRADA") {
      throw new NotFoundException("Beneficiaria no encontrada.");
    }
    if (resultado.estado === "CONFLICTO_VERSION") {
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El registro cambió desde que fue consultado.",
      });
    }
    if (resultado.estado === "CUI_DUPLICADO") {
      throw new ConflictException({
        code: "DUPLICATE_CUI",
        message: "El CUI ya está registrado.",
      });
    }
    return {
      data: {
        ...resumen(resultado.beneficiaria),
        version: resultado.beneficiaria.version,
      },
    };
  }

  async cambiarEstado(id: string, activo: boolean, entrada: CambiarEstadoDto) {
    const resultado = await this.repository.cambiarEstado(id, activo, entrada);
    if (resultado.estado === "NO_ENCONTRADA") {
      throw new NotFoundException("Expediente no encontrado.");
    }
    if (resultado.estado === "CONFLICTO_VERSION") {
      throw new ConflictException({
        code: "VERSION_CONFLICT",
        message: "El expediente cambió desde que fue consultado.",
      });
    }
    if (resultado.estado === "SIN_CAMBIO") {
      throw new ConflictException({
        code: "STATE_CONFLICT",
        message: activo
          ? "El expediente ya está activo."
          : "El expediente ya está inactivo.",
      });
    }
    return { data: resultado.expediente };
  }

  async historial(id: string) {
    const beneficiaria = await this.repository.buscarPorId(id);
    if (!beneficiaria)
      throw new NotFoundException("Beneficiaria no encontrada.");
    return { data: await this.repository.historial(id) };
  }
}
