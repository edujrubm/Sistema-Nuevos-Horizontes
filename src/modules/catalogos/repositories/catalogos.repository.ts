import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

type CatalogoPermitido = { tabla: string; id: string; etiqueta: string };

export const CATALOGOS_PERMITIDOS: Record<string, CatalogoPermitido> = {
  etnias: { tabla: "etnia", id: "etnia_id", etiqueta: "nombre" },
  parentescos: { tabla: "parentesco", id: "parentesco_id", etiqueta: "nombre" },
  ocupaciones: { tabla: "ocupacion", id: "ocupacion_id", etiqueta: "nombre" },
  "estados-civiles": {
    tabla: "estado_civil",
    id: "estado_civil_id",
    etiqueta: "nombre",
  },
  "niveles-estudio": {
    tabla: "nivel_estudio",
    id: "nivel_estudio_id",
    etiqueta: "nombre",
  },
  "tipos-acompanante": {
    tabla: "tipo_acompanante",
    id: "tipo_acompanante_id",
    etiqueta: "nombre",
  },
  "estados-estudio": {
    tabla: "estado_estudio",
    id: "estado_estudio_id",
    etiqueta: "nombre",
  },
  "tipos-violencia": {
    tabla: "tipo_violencia",
    id: "tipo_violencia_id",
    etiqueta: "tipo",
  },
  "situaciones-riesgo": {
    tabla: "situacion_riesgo",
    id: "situacion_riesgo_id",
    etiqueta: "nombre",
  },
};

@Injectable()
export class CatalogosRepository {
  constructor(private readonly dataSource: DataSource) {}

  paises() {
    return this.dataSource.query<Array<{ id: string; nombre: string | null }>>(
      "SELECT pais_id::text AS id, nombre FROM new_horizons.pais ORDER BY nombre NULLS LAST, pais_id",
    );
  }

  departamentos(paisId?: string) {
    return this.dataSource.query<
      Array<{ id: string; nombre: string | null; paisId: string }>
    >(
      `SELECT departamento_id::text AS id, nombre, pais_id::text AS "paisId"
       FROM new_horizons.departamento
       WHERE ($1::bigint IS NULL OR pais_id = $1)
       ORDER BY nombre NULLS LAST, departamento_id`,
      [paisId ?? null],
    );
  }

  municipios(departamentoId?: string) {
    return this.dataSource.query<
      Array<{ id: string; nombre: string | null; departamentoId: string }>
    >(
      `SELECT municipio_id::text AS id, nombre, departamento_id::text AS "departamentoId"
       FROM new_horizons.municipio
       WHERE ($1::bigint IS NULL OR departamento_id = $1)
       ORDER BY nombre NULLS LAST, municipio_id`,
      [departamentoId ?? null],
    );
  }

  catalogo(definicion: CatalogoPermitido) {
    return this.dataSource.query<Array<{ id: string; nombre: string | null }>>(
      `SELECT ${definicion.id}::text AS id, ${definicion.etiqueta} AS nombre
       FROM new_horizons.${definicion.tabla}
       ORDER BY ${definicion.etiqueta} NULLS LAST, ${definicion.id}`,
    );
  }
}
