import { Peca } from '../domain/peca.entity';
import { PecaMapper } from './peca.mapper';
import { PecaOrmEntity } from './peca.orm-entity';

describe('PecaMapper', () => {
  it('converte de domínio para ORM', () => {
    const peca = Peca.criar({
      id: 'peca-1',
      nome: 'Óleo 1L',
      preco: 30,
      quantidadeEstoque: 10,
      quantidadeMinima: 2,
    });

    const orm = PecaMapper.toOrm(peca);

    expect(orm.id).toBe('peca-1');
    expect(orm.preco).toBe('30.00');
    expect(orm.quantidadeEstoque).toBe(10);
  });

  it('converte de ORM para domínio', () => {
    const orm = new PecaOrmEntity();
    orm.id = 'peca-1';
    orm.nome = 'Óleo 1L';
    orm.preco = '30.00';
    orm.quantidadeEstoque = 10;
    orm.quantidadeMinima = 2;

    const peca = PecaMapper.toDomain(orm);

    expect(peca.getPreco()).toBe(30);
    expect(peca.getQuantidadeEstoque()).toBe(10);
  });
});
