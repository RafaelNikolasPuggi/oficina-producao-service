# oficina-producao-service

Microsserviço de **Catálogo de Serviços e Peças / Estoque** do sistema de gestão da oficina — Tech Challenge Fase 4 (POS TECH / SOAT).

Parte de uma arquitetura de 3 microsserviços, cada um com seu próprio repositório e banco de dados:

| Serviço | Repositório | Banco |
|---|---|---|
| OS | [oficina-os-service](https://github.com/RafaelNikolasPuggi/oficina-os-service) | PostgreSQL |
| **Produção** (este repo) | `oficina-producao-service` | PostgreSQL |
| Pagamento | [oficina-pagamento-service](https://github.com/RafaelNikolasPuggi/oficina-pagamento-service) | MongoDB |

O monólito da Fase 3 foi preservado intacto como backup em [oficina-tech-challenge](https://github.com/RafaelNikolasPuggi/oficina-tech-challenge).

## O que este serviço possui

- **Serviços** e **Peças** — catálogo e controle de estoque
- Endpoints administrativos (`JwtAuthGuard`, mesmo JWT do `os-service` — verificação stateless, sem tabela de usuário própria)
- Endpoints **internos** (chamados pelo `os-service`, sem autenticação — rede interna do cluster):
  - `POST /servicos/buscar-por-ids`
  - `POST /pecas/buscar-por-ids`
  - `POST /pecas/reservar-estoque` — decremento atômico; responde `409` com `{ pecaNome, disponivel, solicitado }` quando falta estoque

Nunca acessa o banco de **OS** ou **Pagamento** diretamente.

## Rodando localmente

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run start:dev
```

Swagger em `http://localhost:3001/docs` (porta diferente do `os-service` para rodar os dois juntos em dev).

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura
```

## Status

Em construção — extraído do monólito da Fase 3. Próximas etapas: consumidor RabbitMQ para o passo de reserva de estoque da Saga, Terraform/K8s/CI-CD próprios, New Relic.
