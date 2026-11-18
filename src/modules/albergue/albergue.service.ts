import { Injectable } from "@nestjs/common";
import { CrearEstanciaDto } from "./dto/crear-estancia.dto";
import { CrearSalidaTemporalDto } from "./dto/crear-salida-temporal.dto";
import { CrearNacimientoDto } from "./dto/crear-nacimiento.dto";
import {
  ConsultaEstanciasDto,
  HistorialAlbergueDto,
} from "./dto/operacion.dto";
import { AlbergueRepository } from "./repositories/albergue.repository";
import { AlbergueConsultasRepository } from "./repositories/albergue-consultas.repository";

/** Expone los casos de uso HTTP sin mezclar transporte y persistencia. */
@Injectable()
export class AlbergueService {
  constructor(
    private readonly repository: AlbergueRepository,
    private readonly consultas: AlbergueConsultasRepository,
  ) {}
  listarEstancias(
    pagina = 1,
    limite = 20,
    q: ConsultaEstanciasDto = new ConsultaEstanciasDto(),
  ) {
    return this.consultas.listarEstancias(pagina, limite, q);
  }

  obtenerEstancia(id: string) {
    return this.consultas.obtenerEstancia(id);
  }

  crearEstancia(dto: CrearEstanciaDto) {
    return this.repository.crearEstancia(dto);
  }

  registrarSalidaTemporal(estanciaId: string, dto: CrearSalidaTemporalDto) {
    return this.repository.registrarSalidaTemporal(estanciaId, dto);
  }

  registrarRetorno(estanciaId: string) {
    return this.repository.registrarRetorno(estanciaId);
  }

  registrarEgreso(estanciaId: string, motivo: string) {
    return this.repository.registrarEgreso(estanciaId, motivo);
  }

  registrarNacimiento(estanciaId: string, dto: CrearNacimientoDto) {
    return this.repository.registrarNacimiento(estanciaId, dto);
  }

  obtenerResumen() {
    return this.consultas.obtenerResumen();
  }

  listarSalidasPendientes() {
    return this.consultas.listarSalidasPendientes();
  }

  listarMovimientos(pagina = 1, limite = 20) {
    return this.consultas.listarMovimientos(pagina, limite);
  }

  historial(q: HistorialAlbergueDto) {
    return this.consultas.historial(q);
  }

  listarEstados() {
    return this.consultas.listarEstados();
  }
}
