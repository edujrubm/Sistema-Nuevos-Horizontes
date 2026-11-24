import { SetMetadata } from "@nestjs/common";

export const PERMITIR_CAMBIO_CONTRASENA_PENDIENTE =
  "permitir_cambio_contrasena_pendiente";

export const PermitirCambioContrasenaPendiente = () =>
  SetMetadata(PERMITIR_CAMBIO_CONTRASENA_PENDIENTE, true);