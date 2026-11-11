import { DomainException } from '../../../shared/domain/exceptions';
import { Servico } from './servico.entity';

describe('Servico', () => {
  function criar(): Servico {
    return Servico.criar({
      id: 'servico-1',
      nome: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      preco: 150,
      tempoEstimadoMinutos: 60,
    });
  }

  it('cria o serviço com os dados informados', () => {
    const servico = criar();

    expect(servico.getNome()).toBe('Troca de óleo');
    expect(servico.getPreco()).toBe(150);
    expect(servico.getTempoEstimadoMinutos()).toBe(60);
  });

  it('lança DomainException quando o nome é vazio', () => {
    expect(() =>
      Servico.criar({
        id: 'servico-1',
        nome: '  ',
        descricao: '',
        preco: 150,
        tempoEstimadoMinutos: 60,
      }),
    ).toThrow(DomainException);
  });

  it('lança DomainException quando o preço é negativo', () => {
    expect(() =>
      Servico.criar({
        id: 'servico-1',
        nome: 'Troca de óleo',
        descricao: '',
        preco: -1,
        tempoEstimadoMinutos: 60,
      }),
    ).toThrow(DomainException);
  });

  it('lança DomainException quando o tempo estimado não é positivo', () => {
    expect(() =>
      Servico.criar({
        id: 'servico-1',
        nome: 'Troca de óleo',
        descricao: '',
        preco: 150,
        tempoEstimadoMinutos: 0,
      }),
    ).toThrow(DomainException);
  });

  it('atualizar aplica parcialmente os campos informados', () => {
    const servico = criar();

    servico.atualizar({ preco: 180 });

    expect(servico.getPreco()).toBe(180);
    expect(servico.getNome()).toBe('Troca de óleo');
  });

  it('atualizar lança DomainException para preço negativo', () => {
    const servico = criar();

    expect(() => servico.atualizar({ preco: -10 })).toThrow(DomainException);
  });

  it('atualizar lança DomainException para tempo estimado não positivo', () => {
    const servico = criar();

    expect(() => servico.atualizar({ tempoEstimadoMinutos: 0 })).toThrow(
      DomainException,
    );
  });
});
