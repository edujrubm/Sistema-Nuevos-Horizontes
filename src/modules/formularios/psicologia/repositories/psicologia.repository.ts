import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  FichaPsicologica,
  ResumenBeneficiaria,
  ResumenHijo,
} from '../views/psicologia.responses';

interface FichaPsicologicaRow
  extends Omit<
    FichaPsicologica,
    'datosGenerales' | 'familiaresDeclarados' | 'detalle' | 'examenMental'
  > {
  datosGenerales: Record<string, unknown> | null;
  familiaresDeclarados: Record<string, unknown>[];
  detalle: Record<string, unknown>;
  examenMental: Record<string, unknown> | null;
}

@Injectable()
export class PsicologiaRepository {
  constructor(private readonly dataSource: DataSource) {}

  async buscarResumenBeneficiaria(id: string): Promise<ResumenBeneficiaria | null> {
    const rows = await this.dataSource.query<ResumenBeneficiaria[]>(
      `
        SELECT
          b.id_beneficiaria::text AS "id",
          e.id_expediente::text AS "expedienteId",
          b.nombre,
          b.cui,
          b.fecha_nac::text AS "fechaNacimiento"
        FROM new_horizons.beneficiaria b
        INNER JOIN new_horizons.expediente e
          ON e.beneficiaria_id = b.id_beneficiaria
        WHERE b.id_beneficiaria = $1::bigint
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }

  async buscarResumenHijo(id: string): Promise<ResumenHijo | null> {
    const rows = await this.dataSource.query<ResumenHijo[]>(
      `
        SELECT
          n.nino_id::text AS "id",
          e.id_expediente::text AS "expedienteId",
          n.nombre,
          n.cui,
          n.fecha_nac::text AS "fechaNacimiento",
          n.genero,
          jsonb_build_object(
            'id', b.id_beneficiaria::text,
            'nombre', b.nombre
          ) AS beneficiaria
        FROM new_horizons.nino n
        INNER JOIN new_horizons.expediente e
          ON e.id_expediente = n.expediente_id
        INNER JOIN new_horizons.beneficiaria b
          ON b.id_beneficiaria = e.beneficiaria_id
        WHERE n.nino_id = $1::bigint
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }

  async listarFichasBeneficiaria(
    beneficiariaId: string,
    limit: number,
    cursor?: string,
  ): Promise<FichaPsicologica[]> {
    const rows = await this.dataSource.query<FichaPsicologicaRow[]>(
      `
        SELECT
          fa.id::text AS "id",
          fa.tipo,
          fa.estado_codigo AS "estado",
          fa.fecha_atencion AS "fechaAtencion",
          fa.version,
          fa.identidad_al_atender AS "identidadAlAtender",
          fa.firma_documento_id::text AS "firmaDocumentoId",
          jsonb_build_object(
            'id', profesional.id_empleado::text,
            'nombre', profesional.nombre
          ) AS profesional,
          jsonb_build_object(
            'id', capturista.id_empleado::text,
            'nombre', capturista.nombre
          ) AS "capturadoPor",
          fa.creado_en AS "creadoEn",
          fa.actualizado_en AS "actualizadoEn",
          to_jsonb(dga) - 'formulario_id' AS "datosGenerales",
          COALESCE(
            (
              SELECT jsonb_agg(to_jsonb(fd) - 'formulario_id' ORDER BY fd.id)
              FROM new_horizons.familiar_declarado fd
              WHERE fd.formulario_id = fa.id
            ),
            '[]'::jsonb
          ) AS "familiaresDeclarados",
          to_jsonb(pm) - 'formulario_id' - 'tipo' AS detalle,
          to_jsonb(pem) - 'formulario_id' AS "examenMental"
        FROM new_horizons.formulario_area fa
        INNER JOIN new_horizons.expediente e
          ON e.id_expediente = fa.expediente_id
        INNER JOIN new_horizons.psicologia_mujer pm
          ON pm.formulario_id = fa.id
        LEFT JOIN new_horizons.psicologia_examen_mental pem
          ON pem.formulario_id = fa.id
        LEFT JOIN new_horizons.datos_generales_atencion dga
          ON dga.formulario_id = fa.id
        INNER JOIN new_horizons.empleado profesional
          ON profesional.id_empleado = fa.profesional_id
        INNER JOIN new_horizons.empleado capturista
          ON capturista.id_empleado = fa.capturado_por
        WHERE e.beneficiaria_id = $1::bigint
          AND fa.nino_id IS NULL
          AND fa.tipo = 'PSICOLOGIA_MUJER'
          AND ($2::bigint IS NULL OR fa.id < $2::bigint)
        ORDER BY fa.id DESC
        LIMIT $3
      `,
      [beneficiariaId, cursor ?? null, limit + 1],
    );

    return rows.map((row) => this.presentarFicha(row));
  }

  async listarFichasHijo(
    hijoId: string,
    limit: number,
    cursor?: string,
  ): Promise<FichaPsicologica[]> {
    const rows = await this.dataSource.query<FichaPsicologicaRow[]>(
      `
        SELECT
          fa.id::text AS "id",
          fa.tipo,
          fa.estado_codigo AS "estado",
          fa.fecha_atencion AS "fechaAtencion",
          fa.version,
          fa.identidad_al_atender AS "identidadAlAtender",
          fa.firma_documento_id::text AS "firmaDocumentoId",
          jsonb_build_object(
            'id', profesional.id_empleado::text,
            'nombre', profesional.nombre
          ) AS profesional,
          jsonb_build_object(
            'id', capturista.id_empleado::text,
            'nombre', capturista.nombre
          ) AS "capturadoPor",
          fa.creado_en AS "creadoEn",
          fa.actualizado_en AS "actualizadoEn",
          to_jsonb(dga) - 'formulario_id' AS "datosGenerales",
          COALESCE(
            (
              SELECT jsonb_agg(to_jsonb(fd) - 'formulario_id' ORDER BY fd.id)
              FROM new_horizons.familiar_declarado fd
              WHERE fd.formulario_id = fa.id
            ),
            '[]'::jsonb
          ) AS "familiaresDeclarados",
          to_jsonb(pn) - 'formulario_id' - 'tipo' AS detalle,
          to_jsonb(pem) - 'formulario_id' AS "examenMental"
        FROM new_horizons.formulario_area fa
        INNER JOIN new_horizons.psicologia_ninez pn
          ON pn.formulario_id = fa.id
        LEFT JOIN new_horizons.psicologia_examen_mental pem
          ON pem.formulario_id = fa.id
        LEFT JOIN new_horizons.datos_generales_atencion dga
          ON dga.formulario_id = fa.id
        INNER JOIN new_horizons.empleado profesional
          ON profesional.id_empleado = fa.profesional_id
        INNER JOIN new_horizons.empleado capturista
          ON capturista.id_empleado = fa.capturado_por
        WHERE fa.nino_id = $1::bigint
          AND fa.tipo = 'PSICOLOGIA_NINEZ'
          AND ($2::bigint IS NULL OR fa.id < $2::bigint)
        ORDER BY fa.id DESC
        LIMIT $3
      `,
      [hijoId, cursor ?? null, limit + 1],
    );

    return rows.map((row) => this.presentarFicha(row));
  }

  private presentarFicha(row: FichaPsicologicaRow): FichaPsicologica {
    return {
      ...row,
      identidadAlAtender: this.toCamelCaseDeep(row.identidadAlAtender),
      datosGenerales: row.datosGenerales
        ? this.toCamelCaseDeep(row.datosGenerales)
        : null,
      familiaresDeclarados: this.toCamelCaseDeep(
        row.familiaresDeclarados,
      ) as Record<string, unknown>[],
      detalle: this.toCamelCaseDeep(row.detalle),
      examenMental: row.examenMental ? this.toCamelCaseDeep(row.examenMental) : null,
    };
  }

  private toCamelCaseDeep(value: Record<string, unknown>): Record<string, unknown>;
  private toCamelCaseDeep(value: unknown): unknown;
  private toCamelCaseDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.toCamelCaseDeep(item));
    }

    if (value === null || typeof value !== 'object' || value instanceof Date) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        this.toCamelCaseDeep(nestedValue),
      ]),
    );
  }
}
