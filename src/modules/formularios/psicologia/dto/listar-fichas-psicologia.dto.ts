import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/** Parámetros admitidos por los listados paginados de fichas psicológicas. */
export class ListarFichasPsicologiaDto {
  /** Identificador de la última ficha recibida en la página anterior. */
  @IsOptional()
  @Matches(/^[1-9]\d*$/, { message: 'cursor debe ser un identificador válido.' })
  cursor?: string;

  /** Cantidad máxima de fichas devueltas por solicitud. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
