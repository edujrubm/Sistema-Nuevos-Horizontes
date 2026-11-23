import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { Usuario } from "./entities/usuario.entity";
import { Empleado } from "./entities/empleado.entity";
import { Rol } from "./entities/rol.entity";
import { SeguridadService } from "./seguridad.service";
import { SeguridadController } from "./seguridad.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermisosGuard } from "./guards/permisos.guard";
import { AmbitoGuard } from "./guards/ambito.guard";
import { BeneficiariaAmbitoGuard } from "./guards/beneficiaria-ambito.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Empleado, Rol]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: "15m",
          algorithm: "HS256",
        },
      }),
    }),
  ],
  exports: [
    TypeOrmModule,
    JwtModule,
    JwtAuthGuard,
    PermisosGuard,
    AmbitoGuard,
    BeneficiariaAmbitoGuard,
  ],
  controllers: [SeguridadController],
  providers: [
    SeguridadService,
    JwtAuthGuard,
    PermisosGuard,
    AmbitoGuard,
    BeneficiariaAmbitoGuard,
  ],
})
export class SeguridadModule {}
