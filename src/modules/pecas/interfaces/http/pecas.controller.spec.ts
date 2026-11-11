import { HttpStatus } from '@nestjs/common';
import { Peca } from '../../domain/peca.entity';
import { InsufficientStockException } from '../../../../shared/domain/exceptions';
import type { PecasService } from '../../application/pecas.service';
import { PecasController } from './pecas.controller';

interface MockResponse {
  status: jest.Mock<MockResponse, [number]>;
  send: jest.Mock;
  json: jest.Mock;
}

function criarMockResponse(): MockResponse {
  const res = {
    send: jest.fn(),
    json: jest.fn(),
  } as unknown as MockResponse;
  res.status = jest.fn(() => res);
  return res;
}

describe('PecasController', () => {
  let pecasService: jest.Mocked<PecasService>;
  let controller: PecasController;

  const peca = Peca.criar({
    id: 'peca-1',
    nome: 'Óleo 1L',
    preco: 30,
    quantidadeEstoque: 10,
    quantidadeMinima: 2,
  });

  beforeEach(() => {
    pecasService = {
      criar: jest.fn(),
      atualizar: jest.fn(),
      ajustarEstoque: jest.fn(),
      obter: jest.fn(),
      listar: jest.fn(),
      remover: jest.fn(),
      buscarPorIds: jest.fn(),
      reservarEstoque: jest.fn(),
    } as unknown as jest.Mocked<PecasService>;

    controller = new PecasController(pecasService);
  });

  it('buscarPorIds devolve as peças mapeadas pra DTO', async () => {
    pecasService.buscarPorIds.mockResolvedValueOnce([peca]);

    const resultado = await controller.buscarPorIds({ ids: ['peca-1'] });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('peca-1');
  });

  it('reservarEstoque responde 204 quando a reserva é bem-sucedida', async () => {
    pecasService.reservarEstoque.mockResolvedValueOnce(undefined);
    const res = criarMockResponse();

    await controller.reservarEstoque(
      { itens: [{ pecaId: 'peca-1', quantidade: 2 }] },
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(res.send).toHaveBeenCalled();
  });

  it('reservarEstoque responde 409 estruturado quando falta estoque', async () => {
    pecasService.reservarEstoque.mockRejectedValueOnce(
      new InsufficientStockException('Óleo 1L', 1, 2),
    );
    const res = criarMockResponse();

    await controller.reservarEstoque(
      { itens: [{ pecaId: 'peca-1', quantidade: 2 }] },
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(res.json).toHaveBeenCalledWith({
      pecaNome: 'Óleo 1L',
      disponivel: 1,
      solicitado: 2,
    });
  });

  it('reservarEstoque propaga erros inesperados', async () => {
    pecasService.reservarEstoque.mockRejectedValueOnce(new Error('boom'));
    const res = criarMockResponse();

    await expect(
      controller.reservarEstoque(
        { itens: [{ pecaId: 'peca-1', quantidade: 2 }] },
        res as never,
      ),
    ).rejects.toThrow('boom');
  });

  it('criar delega pro service', async () => {
    pecasService.criar.mockResolvedValueOnce(peca);

    const resultado = await controller.criar({
      nome: 'Óleo 1L',
      preco: 30,
      quantidadeEstoque: 10,
      quantidadeMinima: 2,
    });

    expect(resultado.id).toBe('peca-1');
  });

  it('listar devolve a página mapeada pra DTO', async () => {
    pecasService.listar.mockResolvedValueOnce({
      items: [peca],
      total: 1,
      page: 1,
      limit: 20,
    });

    const resultado = await controller.listar({ page: 1, limit: 20 });

    expect(resultado.items[0].id).toBe('peca-1');
  });

  it('obter devolve a peça mapeada pra DTO', async () => {
    pecasService.obter.mockResolvedValueOnce(peca);

    const resultado = await controller.obter('peca-1');

    expect(resultado.nome).toBe('Óleo 1L');
  });

  it('atualizar delega pro service', async () => {
    pecasService.atualizar.mockResolvedValueOnce(peca);

    await controller.atualizar('peca-1', { preco: 35 });

    expect(pecasService.atualizar).toHaveBeenCalledWith('peca-1', {
      preco: 35,
    });
  });

  it('ajustarEstoque delega pro service', async () => {
    pecasService.ajustarEstoque.mockResolvedValueOnce(peca);

    await controller.ajustarEstoque('peca-1', { delta: -2 });

    expect(pecasService.ajustarEstoque).toHaveBeenCalledWith('peca-1', -2);
  });

  it('remover delega pro service', async () => {
    await controller.remover('peca-1');

    expect(pecasService.remover).toHaveBeenCalledWith('peca-1');
  });
});
