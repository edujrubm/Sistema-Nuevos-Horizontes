import { Module } from "@nestjs/common";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { ErroresApiFilter } from "./errores.filter";
import { validacionApi } from "./validacion";
@Module({
  providers: [
    { provide: APP_FILTER, useClass: ErroresApiFilter },
    { provide: APP_PIPE, useFactory: validacionApi },
  ],
})
export class ErroresApiModule {}
