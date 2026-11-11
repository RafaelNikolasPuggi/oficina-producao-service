import { Servico } from '../../domain/servico.entity';
import type { ServicosService } from '../../application/servicos.service';
import { ServicosController } from './servicos.controller';

describe('ServicosController', () => {
  let servicosService: jest.Mocked<ServicosService>;
  let controller: ServicosController;

  const servico = Servico.criar({
    id: 'servico-1',
    nome: 'Troca de óleo',
    descricao: 'Troca de óleo e filtro',
    preco: 150,
    tempoEstimadoMinutos: 60,
  });

  beforeEach(() => {
    servicosService = {
      criar: jest.fn(),
      atualizar: jest.fn(),
      obter: jest.fn(),
      listar: jest.fn(),
      remover: jest.fn(),
      buscarPorIds: jest.fn(),
    } as unknown as jest.Mocked<ServicosService>;

    controller = new ServicosController(servicosService);
  });

  it('buscarPorIds devolve os serviços mapeados pra DTO', async () => {
    servicosService.buscarPorIds.mockResolvedValueOnce([servico]);

    const resultado = await controller.buscarPorIds({ ids: ['servico-1'] });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('servico-1');
  });

  it('criar delega pro service', async () => {
    servicosService.criar.mockResolvedValueOnce(servico);

    const resultado = await controller.criar({
      nome: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });

    expect(resultado.id).toBe('servico-1');
  });

  it('listar devolve a página mapeada pra DTO', async () => {
    servicosService.listar.mockResolvedValueOnce({
      items: [servico],
      total: 1,
      page: 1,
      limit: 20,
    });

    const resultado = await controller.listar({ page: 1, limit: 20 });

    expect(resultado.items[0].id).toBe('servico-1');
  });

  it('obter devolve o serviço mapeado pra DTO', async () => {
    servicosService.obter.mockResolvedValueOnce(servico);

    const resultado = await controller.obter('servico-1');

    expect(resultado.nome).toBe('Troca de óleo');
  });

  it('atualizar delega pro service', async () => {
    servicosService.atualizar.mockResolvedValueOnce(servico);

    await controller.atualizar('servico-1', { preco: 180 });

    expect(servicosService.atualizar).toHaveBeenCalledWith('servico-1', {
      preco: 180,
    });
  });

  it('remover delega pro service', async () => {
    await controller.remover('servico-1');

    expect(servicosService.remover).toHaveBeenCalledWith('servico-1');
  });
});
