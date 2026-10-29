import { NotFoundException } from '@nestjs/common';

import { PsicologiaRepository } from './repositories/psicologia.repository';
import { PsicologiaService } from './psicologia.service';
import { FichaPsicologica, ResumenBeneficiaria } from './views/psicologia.responses';

type RepositoryMock = jest.Mocked<
  Pick<
    PsicologiaRepository,
    | 'buscarResumenBeneficiaria'
    | 'buscarResumenHijo'
    | 'listarFichasBeneficiaria'
    | 'listarFichasHijo'
  >
>;

describe('PsicologiaService', () => {
  let repository: RepositoryMock;
  let service: PsicologiaService;

  beforeEach(() => {
    repository = {
      buscarResumenBeneficiaria: jest.fn(),
      buscarResumenHijo: jest.fn(),
      listarFichasBeneficiaria: jest.fn(),
      listarFichasHijo: jest.fn(),
    };
    service = new PsicologiaService(repository as unknown as PsicologiaRepository);
  });

  it('devuelve solamente la identificación resumida de la beneficiaria', async () => {
    const resumen: ResumenBeneficiaria = {
      id: '10',
      expedienteId: '20',
      nombre: 'Persona de prueba',
      cui: null,
      fechaNacimiento: '2000-01-01',
    };
    repository.buscarResumenBeneficiaria.mockResolvedValue(resumen);

    await expect(service.obtenerResumenBeneficiaria('10')).resolves.toEqual({ data: resumen });
  });

  it('no revela si faltan fichas cuando la beneficiaria no existe', async () => {
    repository.buscarResumenBeneficiaria.mockResolvedValue(null);

    await expect(
      service.obtenerFichasBeneficiaria('999', { limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.listarFichasBeneficiaria).not.toHaveBeenCalled();
  });

  it('pagina las fichas con cursor estable', async () => {
    repository.buscarResumenBeneficiaria.mockResolvedValue({
      id: '10',
      expedienteId: '20',
      nombre: 'Persona de prueba',
      cui: null,
      fechaNacimiento: null,
    });
    const fichas = [thisFicha('30'), thisFicha('29'), thisFicha('28')];
    repository.listarFichasBeneficiaria.mockResolvedValue(fichas);

    await expect(service.obtenerFichasBeneficiaria('10', { limit: 2 })).resolves.toEqual({
      data: fichas.slice(0, 2),
      page: { hasMore: true, nextCursor: '29' },
    });
  });
});

function thisFicha(id: string): FichaPsicologica {
  return {
    id,
    tipo: 'PSICOLOGIA_MUJER',
    estado: 'BORRADOR',
    fechaAtencion: '2026-10-28T12:00:00.000Z',
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
    examenMental: null,
  };
}
