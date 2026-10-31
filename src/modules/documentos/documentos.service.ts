import { BadRequestException, Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';
import { AnularDocumentoDto } from './dto/anular-documento.dto';
import { CrearCargaDocumentoDto } from './dto/crear-carga-documento.dto';


@Injectable()
export class DocumentosService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listarPorBeneficiaria(beneficiariaId: string) {
    if (!/^[1-9]\d*$/.test(beneficiariaId)) {
      throw new BadRequestException('El ID de la beneficiaria no es válido');
    }

    const beneficiarias = await this.dataSource.query(
      `
      SELECT id_beneficiaria
      FROM new_horizons.beneficiaria
      WHERE id_beneficiaria = $1
      `,
      [beneficiariaId],
    );

    if (beneficiarias.length === 0) {
      throw new NotFoundException('La beneficiaria no existe');
    }

    return this.dataSource.query(
      `
      SELECT
        d.id::text AS "id",
        d.formulario_id::text AS "formularioId",
        f.area_id::text AS "areaId",
        d.categoria,
        d.mime,
        d.tamano_bytes::text AS "tamanoBytes",
        d.version_documento AS "versionDocumento",
        d.cargado_en AS "cargadoEn",
        (d.anulado_en IS NOT NULL) AS "anulado"
      FROM new_horizons.documento_area d
      INNER JOIN new_horizons.formulario_area f
        ON f.id = d.formulario_id
      INNER JOIN new_horizons.expediente e
        ON e.id_expediente = f.expediente_id
      WHERE e.beneficiaria_id = $1
      ORDER BY d.cargado_en DESC, d.id DESC
      `,
      [beneficiariaId],
    );
  }
  async obtenerDocumento(id: string) {
  if (!/^[1-9]\d*$/.test(id)) {
    throw new BadRequestException('El ID del documento no es válido');
  }

  const documentos = await this.dataSource.query(
    `
    SELECT
      d.id::text AS "id",
      d.formulario_id::text AS "formularioId",
      f.expediente_id::text AS "expedienteId",
      e.beneficiaria_id::text AS "beneficiariaId",
      f.area_id::text AS "areaId",
      d.categoria,
      d.mime,
      d.tamano_bytes::text AS "tamanoBytes",
      d.sha256,
      d.version_documento AS "versionDocumento",
      d.documento_anterior_id::text AS "documentoAnteriorId",
      d.cargado_en AS "cargadoEn",
      (d.anulado_en IS NOT NULL) AS "anulado",
      d.anulado_en AS "anuladoEn",
      d.motivo_anulacion AS "motivoAnulacion"
    FROM new_horizons.documento_area d
    INNER JOIN new_horizons.formulario_area f
      ON f.id = d.formulario_id
    INNER JOIN new_horizons.expediente e
      ON e.id_expediente = f.expediente_id
    WHERE d.id = $1
    `,
    [id],
  );

  if (documentos.length === 0) {
    throw new NotFoundException('El documento no existe');
  }

  return documentos[0];
}

async listarVersiones(id: string) {
  if (!/^[1-9]\d*$/.test(id)) {
    throw new BadRequestException('El ID del documento no es válido');
  }

  // Verificar que el documento exista
  await this.obtenerDocumento(id);

  const versiones = await this.dataSource.query(
    `
    WITH RECURSIVE cadena AS (
      SELECT
        d.id,
        d.documento_anterior_id,
        d.formulario_id,
        d.categoria,
        d.mime,
        d.tamano_bytes,
        d.version_documento,
        d.cargado_en,
        d.anulado_en,
        0 AS profundidad
      FROM new_horizons.documento_area d
      WHERE d.id = $1

      UNION ALL

      SELECT
        anterior.id,
        anterior.documento_anterior_id,
        anterior.formulario_id,
        anterior.categoria,
        anterior.mime,
        anterior.tamano_bytes,
        anterior.version_documento,
        anterior.cargado_en,
        anterior.anulado_en,
        cadena.profundidad + 1
      FROM new_horizons.documento_area anterior
      INNER JOIN cadena
        ON anterior.id = cadena.documento_anterior_id
      WHERE cadena.profundidad < 100
    )
    SELECT
      id::text AS "id",
      formulario_id::text AS "formularioId",
      categoria,
      mime,
      tamano_bytes::text AS "tamanoBytes",
      version_documento AS "versionDocumento",
      cargado_en AS "cargadoEn",
      (anulado_en IS NOT NULL) AS "anulado"
    FROM cadena
    ORDER BY version_documento DESC, cargado_en DESC
    `,
    [id],
  );

  return versiones;
}

async crearVersion(id: string) {
  // Verificar que el documento original exista.
  await this.obtenerDocumento(id);

  // La creación de versiones requiere verificar un archivo real.
  throw new ServiceUnavailableException(
    'La creación de versiones estará disponible cuando se integre el almacenamiento privado',
  );
}

async anularDocumento(id: string, dto: AnularDocumentoDto) {
  if (!/^[1-9]\d*$/.test(id)) {
    throw new BadRequestException('El ID del documento no es válido');
  }

  const motivo = dto.motivo?.trim();

  if (!motivo) {
    throw new BadRequestException('El motivo de anulación es obligatorio');
  }

  return this.dataSource.transaction(async (manager) => {
    // 1. Obtener el usuario técnico de pruebas
    const usuarios = await manager.query(
      `
      SELECT id_usuario::text AS id
      FROM new_horizons.usuario
      WHERE nombre_usuario = 'desarrollo_albergue'
      LIMIT 1
      `,
    );

    if (usuarios.length === 0) {
      throw new InternalServerErrorException(
        'No existe el usuario técnico de desarrollo',
      );
    }

    const usuarioId = usuarios[0].id as string;

    // 2. Establecer el contexto de auditoría en la misma transacción
    await manager.query(
      `SELECT set_config('new_horizons.actor_id', $1, true)`,
      [usuarioId],
    );

    await manager.query(
      `SELECT set_config('new_horizons.motivo', $1, true)`,
      [motivo],
    );

    // 3. Bloquear el documento para evitar anulaciones simultáneas
    const documentos = await manager.query(
      `
      SELECT id, anulado_en
      FROM new_horizons.documento_area
      WHERE id = $1
      FOR UPDATE
      `,
      [id],
    );

    if (documentos.length === 0) {
      throw new NotFoundException('El documento no existe');
    }

    // 4. Verificar que no esté anulado
    if (documentos[0].anulado_en !== null) {
      throw new ConflictException('El documento ya está anulado');
    }

    // 5. Registrar la anulación
    const resultado = await manager.query(
      `
      UPDATE new_horizons.documento_area
      SET
        anulado_en = CURRENT_TIMESTAMP,
        anulado_por = $2,
        motivo_anulacion = $3
      WHERE id = $1
        AND anulado_en IS NULL
      RETURNING
        id::text AS "id",
        formulario_id::text AS "formularioId",
        categoria,
        version_documento AS "versionDocumento",
        anulado_en AS "anuladoEn",
        anulado_por::text AS "anuladoPor",
        motivo_anulacion AS "motivoAnulacion"
      `,
      [id, usuarioId, motivo],
    );

    if (resultado.length === 0) {
      throw new ConflictException(
        'El documento ya fue anulado',
      );
    }

    return resultado[0];
  });
}

async solicitarCarga(
  beneficiariaId: string,
  dto: CrearCargaDocumentoDto,
) {
  if (!/^[1-9]\d*$/.test(beneficiariaId)) {
    throw new BadRequestException('El ID de la beneficiaria no es válido');
  }

  const formularios = await this.dataSource.query(
    `
    SELECT f.id
    FROM new_horizons.formulario_area f
    INNER JOIN new_horizons.expediente e
      ON e.id_expediente = f.expediente_id
    WHERE f.id = $1
      AND e.beneficiaria_id = $2
    `,
    [dto.formularioId, beneficiariaId],
  );

  if (formularios.length === 0) {
    throw new NotFoundException(
      'No existe un formulario asociado a esta beneficiaria',
    );
  }

  throw new ServiceUnavailableException(
    'La carga de documentos estará disponible cuando se integre Firebase Storage',
  );
}

async completarCarga(cargaId: string) {
  if (!/^[1-9]\d*$/.test(cargaId)) {
    throw new BadRequestException(
      'El ID de la carga no es válido',
    );
  }

  throw new ServiceUnavailableException(
    'La confirmación de documentos estará disponible cuando se integre Firebase Storage',
  );
}
}