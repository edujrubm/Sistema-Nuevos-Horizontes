import { SetMetadata } from "@nestjs/common";

export const REQUIERE_AMBITO_KEY = "requiere_ambito";

export interface AmbitoRequerido {
  areaId: number;
  expedienteParam: string;
}

export const RequiereAmbito = (
  areaId: number,
  expedienteParam = "expedienteId",
) =>
  SetMetadata(REQUIERE_AMBITO_KEY, {
    areaId,
    expedienteParam,
  } satisfies AmbitoRequerido);
