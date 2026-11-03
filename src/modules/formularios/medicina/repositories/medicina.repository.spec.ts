import { DataSource } from 'typeorm';

import { MedicinaRepository } from './medicina.repository';
import { TipoFichaMedica } from '../views/medicina.responses';

describe('MedicinaRepository', () => {
  let query: jest.Mock;
  let repository: MedicinaRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new MedicinaRepository({ query } as unknown as DataSource);
  });

  it('expone solo los campos aplicables a adolescente y mujer', async () => {
    query.mockResolvedValue([
      crearFila('2', 'MEDICINA_MUJER'),
      crearFila('1', 'MEDICINA_ADOLESCENTE'),
    ]);

    const fichas = await repository.listarFichasBeneficiaria('10', 20);

    expect(fichas[0].detalle).toEqual(
      expect.objectContaining({
        antecedentesImportancia: 'importancia',
        antecedentesGinecologicos: 'ginecológicos',
        ginecologico: 'examen ginecológico',
      }),
    );
    expect(fichas[0].detalle).not.toHaveProperty('esquemaVacunacion');

    expect(fichas[1].detalle).toEqual(
      expect.objectContaining({
        esquemaVacunacion: 'completo',
        antecedentesPatologicos: 'ninguno',
        antecedentesGinecologicos: 'ginecológicos',
      }),
    );
    expect(fichas[1].detalle).not.toHaveProperty('antecedentesImportancia');
    expect(fichas[1].detalle).not.toHaveProperty('ginecologico');
  });

  it('limita la ruta de hijos a la variante de niñez', async () => {
    query.mockResolvedValue([crearFila('3', 'MEDICINA_NINEZ')]);

    const [ficha] = await repository.listarFichasHijo('7', 20, '4');

    expect(query.mock.calls[0][0]).toContain("fa.tipo = 'MEDICINA_NINEZ'");
    expect(query.mock.calls[0][1]).toEqual(['7', '4', 21]);
    expect(ficha.detalle).toEqual(
      expect.objectContaining({
        nombreResponsableDeclarado: 'Responsable',
        esquemaVacunacion: 'completo',
        condicionesNacer: 'sin complicaciones',
        antecedentesPatologicos: 'ninguno',
      }),
    );
    expect(ficha.detalle).not.toHaveProperty('antecedentesGinecologicos');
  });
});

function crearFila(id: string, tipo: TipoFichaMedica) {
  return {
    id,
    tipo,
    estado: 'BORRADOR',
    fechaAtencion: '2026-10-28T12:00:00.000Z',
    edadAlAtender: 17,
    version: 1,
    identidadAlAtender: { fecha_nacimiento: '2009-01-01' },
    firmaDocumentoId: null,
    profesional: { id: '1', nombre: 'Profesional de prueba' },
    capturadoPor: { id: '1', nombre: 'Profesional de prueba' },
    creadoEn: '2026-10-28T12:00:00.000Z',
    actualizadoEn: '2026-10-28T12:00:00.000Z',
    datosGenerales: null,
    familiaresDeclarados: [],
    detalle: {
      motivo_consulta: 'consulta',
      nombre_responsable_declarado: 'Responsable',
      esquema_vacunacion: 'completo',
      condiciones_nacer: 'sin complicaciones',
      antecedentes_patologicos: 'ninguno',
      antecedentes_importancia: 'importancia',
      antecedentes_ginecologicos: 'ginecológicos',
      ginecologico: 'examen ginecológico',
    },
  };
}
