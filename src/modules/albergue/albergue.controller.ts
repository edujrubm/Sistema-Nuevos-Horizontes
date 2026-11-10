import {
  Body,
  Controller,
  Get,
  Post,
  ValidationPipe,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';

import { AlbergueService } from './albergue.service';
import { CrearEstanciaDto } from './dto/crear-estancia.dto';
import { CrearSalidaTemporalDto } from './dto/crear-salida-temporal.dto';
import { CrearNacimientoDto } from './dto/crear-nacimiento.dto';

@Controller('albergue')
export class AlbergueController {
  constructor(private readonly albergueService: AlbergueService) {}

  @Get('estancias')
  async listarEstancias(
    @Query('pagina') pagina = '1',
    @Query('limite') limite = '20',
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
        'La página debe ser positiva y el límite debe estar entre 1 y 100',
      );
    }

    return this.albergueService.listarEstancias(paginaNumero, limiteNumero);
  }
  @Post('estancias')
  async crearEstancia(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearEstanciaDto,
  ) {
    return this.albergueService.crearEstancia(dto);
  }

  @Get('estancias/:id')
  async obtenerEstancia(@Param('id') id: string) {
    return this.albergueService.obtenerEstancia(id);
  }

  @Post('estancias/:id/salidas-temporales')
  async registrarSalidaTemporal(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearSalidaTemporalDto,
  ) {
    return this.albergueService.registrarSalidaTemporal(id, dto);
  }

  @Post('estancias/:id/retornos')
  async registrarRetorno(@Param('id') id: string) {
    return this.albergueService.registrarRetorno(id);
  }
  @Post('estancias/:id/egreso')
  async registrarEgreso(@Param('id') id: string) {
    return this.albergueService.registrarEgreso(id);
  }

  @Post('estancias/:id/nacimientos')
  async registrarNacimiento(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CrearNacimientoDto,
  ) {
    return this.albergueService.registrarNacimiento(id, dto);
  }
  @Get('resumen')
  async obtenerResumen() {
    return this.albergueService.obtenerResumen();
  }

  @Get('salidas-temporales/pendientes')
  async listarSalidasPendientes() {
    return this.albergueService.listarSalidasPendientes();
  }

  @Get('movimientos')
  async listarMovimientos(
    @Query('pagina') pagina = '1',
    @Query('limite') limite = '20',
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
        'La página debe ser positiva y el límite debe estar entre 1 y 100',
      );
    }

    return this.albergueService.listarMovimientos(paginaNumero, limiteNumero);
  }
  @Get('estados')
  async listarEstados() {
    return this.albergueService.listarEstados();
  }
}
