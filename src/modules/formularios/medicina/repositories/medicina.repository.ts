import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  FichaMedica,
  ResumenBeneficiariaMedicina,
  ResumenHijoMedicina,
  TipoFichaMedica,
} from '../views/medicina.responses';

interface FichaMedicaRow extends Omit<
  FichaMedica,
  'datosGenerales' | 'familiaresDeclarados' | 'detalle'
> {
  datosGenerales: Record<string, unknown> | null;
  familiaresDeclarados: Record<string, unknown>[];
  detalle: Record<string, unknown>;
}

const CAMPOS_COMUNES = [
  'motivoConsulta',
  'historiaEnfermedadActual',
  'examenFisicoGeneral',
  'cabeza',
  'torax',
  'abdomen',
  'genitales',
  'extremidades',
  'impresionClinica',
  'tratamiento',
  'laboratoriosExamenes',
  'referencia',
  'proximaCitaIndicaciones',
  'frecuenciaCardiacaLpm',
  'frecuenciaRespiratoriaRpm',
  'temperaturaC',
  'tallaCm',
  'pesoKg',
  'presionSistolicaMmhg',
  'presionDiastolicaMmhg',
  'proximaCita',
] as const;

const CAMPOS_POR_TIPO: Record<TipoFichaMedica, readonly string[]> = {
  MEDICINA_NINEZ: [
    'nombreResponsableDeclarado',
    'esquemaVacunacion',
    'condicionesNacer',
    'antecedentesPatologicos',
  ],
  MEDICINA_ADOLESCENTE: [
    'nombreResponsableDeclarado',
    'esquemaVacunacion',
    'condicionesNacer',
    'antecedentesPatologicos',
    'antecedentesGinecologicos',
  ],
  MEDICINA_MUJER: [
    'antecedentesImportancia',
    'antecedentesGinecologicos',
    'ginecologico',
  ],
};

/** Centraliza las consultas de solo lectura del área de Medicina. */
@Injectable()
export class MedicinaRepository {
  constructor(private readonly dataSource: DataSource) {}

  async buscarResumenBeneficiaria(
    id: string,
  ): Promise<ResumenBeneficiariaMedicina | null> {
    const rows = await this.dataSource.query<ResumenBeneficiariaMedicina[]>(
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

  async buscarResumenHijo(id: string): Promise<ResumenHijoMedicina | null> {
    const rows = await this.dataSource.query<ResumenHijoMedicina[]>(
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

  /**
   * Recupera el historial de la beneficiaria. El tipo persistido en cada atención decide
   * si se presenta como ficha de adolescente o de mujer; no se reclasifica por la edad actual.
   */
  async listarFichasBeneficiaria(
    beneficiariaId: string,
    limit: number,
    cursor?: string,
  ): Promise<FichaMedica[]> {
    return this.listarFichas(
      `
        INNER JOIN new_horizons.expediente e
          ON e.id_expediente = fa.expediente_id
        WHERE e.beneficiaria_id = $1::bigint
          AND fa.nino_id IS NULL
          AND fa.tipo IN ('MEDICINA_ADOLESCENTE', 'MEDICINA_MUJER')
          AND ($2::bigint IS NULL OR fa.id < $2::bigint)
      `,
      [beneficiariaId, cursor ?? null, limit + 1],
    );
  }

  /** Recupera únicamente fichas infantiles del hijo indicado. */
  async listarFichasHijo(
    hijoId: string,
    limit: number,
    cursor?: string,
  ): Promise<FichaMedica[]> {
    return this.listarFichas(
      `
        WHERE fa.nino_id = $1::bigint
          AND fa.tipo = 'MEDICINA_NINEZ'
          AND ($2::bigint IS NULL OR fa.id < $2::bigint)
      `,
      [hijoId, cursor ?? null, limit + 1],
    );
  }

  private async listarFichas(
    filtroSujeto: string,
    parametros: [string, string | null, number],
  ): Promise<FichaMedica[]> {
    const rows = await this.dataSource.query<FichaMedicaRow[]>(
      `
        SELECT
          fa.id::text AS "id",
          fa.tipo,
          fa.estado_codigo AS "estado",
          fa.fecha_atencion AS "fechaAtencion",
          identidad.edad_a_la_atencion AS "edadAlAtender",
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
          to_jsonb(cm) - 'formulario_id' - 'tipo' AS detalle
        FROM new_horizons.formulario_area fa
        INNER JOIN new_horizons.consulta_medica cm
          ON cm.formulario_id = fa.id
          AND cm.tipo = fa.tipo
        INNER JOIN new_horizons.v_identidad_formulario identidad
          ON identidad.formulario_id = fa.id
        LEFT JOIN new_horizons.datos_generales_atencion dga
          ON dga.formulario_id = fa.id
        INNER JOIN new_horizons.empleado profesional
          ON profesional.id_empleado = fa.profesional_id
        INNER JOIN new_horizons.empleado capturista
          ON capturista.id_empleado = fa.capturado_por
        ${filtroSujeto}
        ORDER BY fa.id DESC
        LIMIT $3
      `,
      parametros,
    );

    return rows.map((row) => this.presentarFicha(row));
  }

  private presentarFicha(row: FichaMedicaRow): FichaMedica {
    return {
      ...row,
      identidadAlAtender: this.toCamelCaseDeep(row.identidadAlAtender),
      datosGenerales: row.datosGenerales
        ? this.toCamelCaseDeep(row.datosGenerales)
        : null,
      familiaresDeclarados: this.toCamelCaseDeep(
        row.familiaresDeclarados,
      ) as Record<string, unknown>[],
      detalle: this.presentarDetalle(row.tipo, row.detalle),
    };
  }

  /** Elimina del contrato los campos clínicos que pertenecen a otra variante. */
  private presentarDetalle(
    tipo: TipoFichaMedica,
    detalle: Record<string, unknown>,
  ): Record<string, unknown> {
    const detalleCamelCase = this.toCamelCaseDeep(detalle);
    const campos = [...CAMPOS_COMUNES, ...CAMPOS_POR_TIPO[tipo]];

    return Object.fromEntries(
      campos.map((campo) => [campo, detalleCamelCase[campo] ?? null]),
    );
  }

  private toCamelCaseDeep(
    value: Record<string, unknown>,
  ): Record<string, unknown>;
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
