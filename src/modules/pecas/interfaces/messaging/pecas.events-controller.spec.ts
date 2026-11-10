import type { ClientProxy } from '@nestjs/microservices';
import { InsufficientStockException } from '../../../../shared/domain/exceptions';
import type { PecasService } from '../../application/pecas.service';
import { PecasEventsController } from './pecas.events-controller';

describe('PecasEventsController', () => {
  let pecasService: jest.Mocked<Pick<PecasService, 'reservarEstoque'>>;
  let osClient: jest.Mocked<Pick<ClientProxy, 'emit'>>;
  let controller: PecasEventsController;

  beforeEach(() => {
    pecasService = { reservarEstoque: jest.fn() };
    osClient = { emit: jest.fn() };

    controller = new PecasEventsController(
      pecasService as unknown as PecasService,
      osClient as unknown as ClientProxy,
    );
  });

  it('publica pecas.reservadas quando a reserva é bem-sucedida', async () => {
    pecasService.reservarEstoque.mockResolvedValueOnce(undefined);

    await controller.aoAprovarOrcamento({
      ordemServicoId: 'os-1',
      itens: [{ pecaId: 'peca-1', quantidade: 2 }],
    });

    expect(pecasService.reservarEstoque).toHaveBeenCalledWith([
      { pecaId: 'peca-1', quantidade: 2 },
    ]);
    expect(osClient.emit).toHaveBeenCalledWith('pecas.reservadas', {
      ordemServicoId: 'os-1',
    });
  });

  it('publica reserva.pecas.falhou com o detalhe quando falta estoque', async () => {
    pecasService.reservarEstoque.mockRejectedValueOnce(
      new InsufficientStockException('Óleo 1L', 1, 2),
    );

    await controller.aoAprovarOrcamento({
      ordemServicoId: 'os-1',
      itens: [{ pecaId: 'peca-1', quantidade: 2 }],
    });

    expect(osClient.emit).toHaveBeenCalledWith('reserva.pecas.falhou', {
      ordemServicoId: 'os-1',
      pecaNome: 'Óleo 1L',
      disponivel: 1,
      solicitado: 2,
    });
  });

  it('não lança e não publica nada em falha inesperada (não derruba o consumidor)', async () => {
    pecasService.reservarEstoque.mockRejectedValueOnce(new Error('boom'));

    await expect(
      controller.aoAprovarOrcamento({
        ordemServicoId: 'os-1',
        itens: [{ pecaId: 'peca-1', quantidade: 2 }],
      }),
    ).resolves.toBeUndefined();
    expect(osClient.emit).not.toHaveBeenCalled();
  });
});
