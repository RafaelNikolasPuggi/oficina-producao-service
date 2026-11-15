import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { ServicoOrmEntity } from '../modules/servicos/infrastructure/servico.orm-entity';
import { PecaOrmEntity } from '../modules/pecas/infrastructure/peca.orm-entity';

/**
 * Garante um catálogo mínimo (idempotente) pro deploy real não ficar sem
 * nenhum serviço/peça cadastrado — sem isso, nenhuma OS pode ser aberta no
 * os-service, já que ele resolve nome/preço via REST síncrono aqui.
 *
 * IDs fixos para permitir testes/demonstração referenciarem os mesmos
 * registros entre deploys. Não sobrescreve estoque já existente.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const servicoRepo = app.get<Repository<ServicoOrmEntity>>(
    getRepositoryToken(ServicoOrmEntity),
  );
  const pecaRepo = app.get<Repository<PecaOrmEntity>>(
    getRepositoryToken(PecaOrmEntity),
  );

  const servicoId = '11111111-1111-4111-8111-111111111111';
  if (!(await servicoRepo.findOne({ where: { id: servicoId } }))) {
    await servicoRepo.save(
      servicoRepo.create({
        id: servicoId,
        nome: 'Troca de óleo',
        descricao: 'Troca de óleo do motor e filtro',
        preco: '150.00',
        tempoEstimadoMinutos: 60,
      }),
    );
    console.log(`Serviço "${servicoId}" criado.`);
  } else {
    console.log(`Serviço "${servicoId}" já existia.`);
  }

  const pecaEstoqueOkId = '22222222-2222-4222-8222-222222222222';
  if (!(await pecaRepo.findOne({ where: { id: pecaEstoqueOkId } }))) {
    await pecaRepo.save(
      pecaRepo.create({
        id: pecaEstoqueOkId,
        nome: 'Filtro de óleo',
        preco: '40.00',
        quantidadeEstoque: 50,
        quantidadeMinima: 5,
      }),
    );
    console.log(`Peça "${pecaEstoqueOkId}" criada (estoque 50).`);
  } else {
    console.log(`Peça "${pecaEstoqueOkId}" já existia.`);
  }

  const pecaEstoqueBaixoId = '33333333-3333-4333-8333-333333333333';
  if (!(await pecaRepo.findOne({ where: { id: pecaEstoqueBaixoId } }))) {
    await pecaRepo.save(
      pecaRepo.create({
        id: pecaEstoqueBaixoId,
        nome: 'Pastilha de freio (estoque de demonstração)',
        preco: '90.00',
        quantidadeEstoque: 1,
        quantidadeMinima: 1,
      }),
    );
    console.log(`Peça "${pecaEstoqueBaixoId}" criada (estoque 1, pra testar compensação de estoque insuficiente).`);
  } else {
    console.log(`Peça "${pecaEstoqueBaixoId}" já existia.`);
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Falha ao popular catálogo:', err);
  process.exit(1);
});
