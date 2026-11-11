import { EntityNotFoundException } from '../../../shared/domain/exceptions';
import { Servico } from '../domain/servico.entity';
import type { ServicoRepository } from '../domain/servico.repository';
import { ServicosService } from './servicos.service';

describe('ServicosService', () => {
  let servicoRepository: jest.Mocked<ServicoRepository>;
  let service: ServicosService;

  beforeEach(() => {
    servicoRepository = {
      salvar: jest.fn(async (s) => s),
      buscarPorId: jest.fn(),
      buscarPorIds: jest.fn(),
      listar: jest.fn(),
      remover: jest.fn(),
    };
    service = new ServicosService(servicoRepository);
  });

  it('criar persiste o serviço', async () => {
    const servico = await service.criar({
      nome: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });

    expect(servico.getNome()).toBe('Troca de óleo');
    expect(servicoRepository.salvar).toHaveBeenCalledTimes(1);
  });

  it('atualizar aplica as mudanças e salva', async () => {
    const servico = Servico.criar({
      id: 'servico-1',
      nome: 'Troca de óleo',
      descricao: '',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });
    servicoRepository.buscarPorId.mockResolvedValueOnce(servico);

    const atualizado = await service.atualizar('servico-1', { preco: 180 });

    expect(atualizado.getPreco()).toBe(180);
  });

  it('obter lança EntityNotFoundException quando o serviço não existe', async () => {
    servicoRepository.buscarPorId.mockResolvedValueOnce(null);

    await expect(service.obter('inexistente')).rejects.toThrow(
      EntityNotFoundException,
    );
  });

  it('buscarPorIds delega pro repositório', async () => {
    servicoRepository.buscarPorIds.mockResolvedValueOnce([]);

    await service.buscarPorIds(['servico-1']);

    expect(servicoRepository.buscarPorIds).toHaveBeenCalledWith(['servico-1']);
  });

  it('listar delega pro repositório', async () => {
    servicoRepository.listar.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await service.listar(1, 20);

    expect(servicoRepository.listar).toHaveBeenCalledWith(1, 20);
  });

  it('remover verifica existência antes de remover', async () => {
    const servico = Servico.criar({
      id: 'servico-1',
      nome: 'Troca de óleo',
      descricao: '',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });
    servicoRepository.buscarPorId.mockResolvedValueOnce(servico);

    await service.remover('servico-1');

    expect(servicoRepository.remover).toHaveBeenCalledWith('servico-1');
  });
});
