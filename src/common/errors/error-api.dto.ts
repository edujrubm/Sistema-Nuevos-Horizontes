import { ApiProperty } from "@nestjs/swagger";

class DetalleErrorApiDto {
  @ApiProperty({ example: "ocupacionId" })
  campo!: string;

  @ApiProperty({ example: "Selecciona un registro válido y compatible." })
  mensaje!: string;
}

export class ErrorApiDto {
  @ApiProperty({ example: 400 })
  estado!: number;

  @ApiProperty({ example: "DATOS_INVALIDOS" })
  codigo!: string;

  @ApiProperty({
    example: "Revisa los datos señalados antes de continuar.",
  })
  mensaje!: string;

  @ApiProperty({ type: [DetalleErrorApiDto] })
  errores!: DetalleErrorApiDto[];

  @ApiProperty({ example: "SOL-8f21c6a19d54" })
  idSolicitud!: string;
}
