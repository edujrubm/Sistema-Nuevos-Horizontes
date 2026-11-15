import {
  Body,
  Controller,
  Get,
  Post,
  ValidationPipe,
  Param,
  Query,
  BadRequestException,
} from "@nestjs/common";

import { AlbergueService } from "./albergue.service";
import { CrearEstanciaDto } from "./dto/crear-estancia.dto";
import { CrearSalidaTemporalDto } from "./dto/crear-salida-temporal.dto";
import { ParseBigIntIdPipe as BigintIdPipe } from "../../common/pipes/parse-bigint-id.pipe";
import { CrearNacimientoDto } from "./dto/crear-nacimiento.dto";
import {
  ConsultaEstanciasDto,
  EgresoDto,
  HistorialAlbergueDto,
} from "./dto/operacion.dto";

@Controller("v1/albergue")
export class AlbergueController {
  constructor(private readonly albergueService: AlbergueService) {}

  @Get("estancias")
  async listarEstancias(
    @Query() q: ConsultaEstanciasDto,
    @Query("pagina") pagina = "1",
    @Query("limite") limite = "20",
  ) {
    const paginaNumero = Number(pagina);
    const limiteNumero = Number(limite);

    if (
      !Number.isSafeInteger(paginaNumero) ||
      paginaNumero < 1 ||
      !Number.isSafeInteger(limiteNumero) ||
      limiteNumero < 1 ||
      limiteNumero > 100
    ) {
      throw new BadRequestException(
        "La página debe ser positiva y el límite debe estar entre 1 y 100",
      );
    }

    return this.albergueService.listarEstancias(paginaNumero, limiteNumero, q);
  }
  @Post("estancias")
  async crearEstancia(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearEstanciaDto,
  ) {
    return this.albergueService.crearEstancia(dto);
  }
  @Post("estancias/buscar")
  buscarEstancias(@Body() q: ConsultaEstanciasDto) {
    return this.albergueService.listarEstancias(q.pagina, q.limite, q);
  }

  @Get("estancias/:id")
  async obtenerEstancia(@Param("id", BigintIdPipe) id: string) {
    return this.albergueService.obtenerEstancia(id);
  }

  @Post("estancias/:id/salidas-temporales")
  async registrarSalidaTemporal(
    @Param("id", BigintIdPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearSalidaTemporalDto,
  ) {
    return this.albergueService.registrarSalidaTemporal(id, dto);
  }

  @Post("estancias/:id/retornos")
  async registrarRetorno(@Param("id", BigintIdPipe) id: string) {
    return this.albergueService.registrarRetorno(id);
  }
  @Post("estancias/:id/egreso")
  async registrarEgreso(
    @Param("id", BigintIdPipe) id: string,
    @Body() dto: EgresoDto,
  ) {
    return this.albergueService.registrarEgreso(id, dto.motivo.trim());
  }

  @Post("estancias/:id/nacimientos")
  async registrarNacimiento(
    @Param("id", BigintIdPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearNacimientoDto,
  ) {
    return this.albergueService.registrarNacimiento(id, dto);
  }
  @Get("resumen")
  async obtenerResumen() {
    return this.albergueService.obtenerResumen();
  }

  @Get("salidas-temporales/pendientes")
  async listarSalidasPendientes() {
    return this.albergueService.listarSalidasPendientes();
  }

  @Get("movimientos")
  async listarMovimientos(
    @Query("pagina") pagina = "1",
    @Query("limite") limite = "20",
  ) {
    const paginaNumero = Number(pagina);
    const limiteNumero = Number(limite);

    if (
      !Number.isSafeInteger(paginaNumero) ||
      paginaNumero < 1 ||
      !Number.isSafeInteger(limiteNumero) ||
      limiteNumero < 1 ||
      limiteNumero > 100
    ) {
      throw new BadRequestException(
        "La página debe ser positiva y el límite debe estar entre 1 y 100",
      );
    }

    return this.albergueService.listarMovimientos(paginaNumero, limiteNumero);
  }
  @Get("estados")
  async listarEstados() {
    return this.albergueService.listarEstados();
  }
  @Get("historial") historial(@Query() q: HistorialAlbergueDto) {
    return this.albergueService.historial(q);
  }
}
