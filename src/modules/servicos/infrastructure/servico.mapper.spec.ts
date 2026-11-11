import { Servico } from '../domain/servico.entity';
import { ServicoMapper } from './servico.mapper';
import { ServicoOrmEntity } from './servico.orm-entity';

describe('ServicoMapper', () => {
  it('converte de domínio para ORM', () => {
    const servico = Servico.criar({
      id: 'servico-1',
      nome: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });

    const orm = ServicoMapper.toOrm(servico);

    expect(orm.id).toBe('servico-1');
    expect(orm.preco).toBe('150.00');
    expect(orm.tempoEstimadoMinutos).toBe(60);
  });

  it('converte de ORM para domínio', () => {
    const orm = new ServicoOrmEntity();
    orm.id = 'servico-1';
    orm.nome = 'Troca de óleo';
    orm.descricao = 'Troca de óleo e filtro';
    orm.preco = '150.00';
    orm.tempoEstimadoMinutos = 60;

    const servico = ServicoMapper.toDomain(orm);

    expect(servico.getPreco()).toBe(150);
    expect(servico.getNome()).toBe('Troca de óleo');
  });
});
