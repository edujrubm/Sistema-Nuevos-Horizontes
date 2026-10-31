import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

/** Sustituto LOCAL de la sesión futura. El cliente no puede elegir su ámbito.
 * Se reemplazará por el contexto autenticado sin cambiar las rutas del PDF.
 */
@Injectable()
export class AmbitoLocalService {
  area(): string {
    if (!["development", "test"].includes(process.env.NODE_ENV || "")) {
      throw new ServiceUnavailableException(
        "Ámbito de laboratorio no disponible",
      );
    }
    const area = process.env.P3_TEST_AREA?.trim();
    if (!area)
      throw new ServiceUnavailableException(
        "Configure el área del laboratorio",
      );
    return area;
  }

  comprobar(nombreArea: string, filtro?: string | null) {
    const area = this.area();
    if (nombreArea !== area || (filtro != null && filtro !== area)) {
      throw new ForbiddenException("Operación fuera del área activa");
    }
    return area;
  }

  coordinacion() {
    this.area();
    if (process.env.P3_TEST_ROLE !== "COORDINACION") {
      throw new ForbiddenException(
        "El historial requiere coordinación del área",
      );
    }
  }
}
