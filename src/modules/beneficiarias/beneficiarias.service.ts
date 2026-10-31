import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

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
    const seccionesInvalidas = Object.keys(
      entrada.fichaInicial.seccionesIniciales ?? {},
    ).filter((seccion) => !esSeccionFicha(seccion));
    if (seccionesInvalidas.length) {
      throw new BadRequestException({
        code: "INVALID_SECTION",
        message:
          "La admisión contiene secciones que no pertenecen a la ficha inicial.",
        invalidSections: seccionesInvalidas,
      });
    }
    const resultado = await this.repository.crear(entrada);
    if (resultado.conflictoCui) {
      throw new ConflictException({
        code: "DUPLICATE_CUI",
        message: "El CUI ya está registrado.",
      });
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
