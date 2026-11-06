import { NotFoundException } from '@nestjs/common';

import { MedicinaRepository } from './repositories/medicina.repository';
import { MedicinaService } from './medicina.service';
import { FichaMedica, TipoFichaMedica } from './views/medicina.responses';

type RepositoryMock = jest.Mocked<
  Pick<
    MedicinaRepository,
    | 'buscarResumenBeneficiaria'
    | 'buscarResumenHijo'
    | 'listarFichasBeneficiaria'
    | 'listarFichasHijo'
  >
>;

describe('MedicinaService', () => {
  let repository: RepositoryMock;
  let service: MedicinaService;

  beforeEach(() => {
    repository = {
      buscarResumenBeneficiaria: jest.fn(),
      buscarResumenHijo: jest.fn(),
      listarFichasBeneficiaria: jest.fn(),
      listarFichasHijo: jest.fn(),
    };
    service = new MedicinaService(repository as unknown as MedicinaRepository);
  });

  it('rechaza la consulta cuando la beneficiaria no existe', async () => {
    repository.buscarResumenBeneficiaria.mockResolvedValue(null);

    await expect(
      service.obtenerFichasBeneficiaria('999', { limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.listarFichasBeneficiaria).not.toHaveBeenCalled();
  });

  it('pagina juntas las fichas históricas de adolescente y mujer', async () => {
    repository.buscarResumenBeneficiaria.mockResolvedValue({
      id: '10',
      expedienteId: '20',
      nombre: 'Persona de prueba',
      cui: null,
      fechaNacimiento: '2000-01-01',
    });
    const fichas = [
      crearFicha('30', 'MEDICINA_MUJER'),
      crearFicha('29', 'MEDICINA_ADOLESCENTE'),
      crearFicha('28', 'MEDICINA_ADOLESCENTE'),
    ];
    repository.listarFichasBeneficiaria.mockResolvedValue(fichas);

    await expect(
      service.obtenerFichasBeneficiaria('10', { limit: 2 }),
    ).resolves.toEqual({
      data: fichas.slice(0, 2),
      page: { hasMore: true, nextCursor: '29' },
    });
  });

  it('consulta las fichas de niñez por el identificador del hijo', async () => {
    repository.buscarResumenHijo.mockResolvedValue({
      id: '7',
      expedienteId: '20',
      nombre: 'Infante de prueba',
      cui: null,
      fechaNacimiento: '2020-01-01',
      genero: null,
      beneficiaria: { id: '10', nombre: 'Persona de prueba' },
    });
    repository.listarFichasHijo.mockResolvedValue([
      crearFicha('15', 'MEDICINA_NINEZ'),
    ]);

    await service.obtenerFichasHijo('7', { limit: 20, cursor: '16' });

    expect(repository.listarFichasHijo).toHaveBeenCalledWith('7', 20, '16');
  });
});

function crearFicha(id: string, tipo: TipoFichaMedica): FichaMedica {
  return {
    id,
    tipo,
    estado: 'BORRADOR',
    fechaAtencion: '2026-10-28T12:00:00.000Z',
    edadAlAtender: 20,
    version: 1,
    identidadAlAtender: {},
    firmaDocumentoId: null,
    profesional: { id: '1', nombre: 'Profesional de prueba' },
    capturadoPor: { id: '1', nombre: 'Profesional de prueba' },
    creadoEn: '2026-10-28T12:00:00.000Z',
    actualizadoEn: '2026-10-28T12:00:00.000Z',
    datosGenerales: null,
    familiaresDeclarados: [],
    detalle: {},
  };
}
