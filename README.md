# oficina-producao-service

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=RafaelNikolasPuggi_oficina-producao-service&metric=coverage)](https://sonarcloud.io/summary/new_code?id=RafaelNikolasPuggi_oficina-producao-service)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=RafaelNikolasPuggi_oficina-producao-service&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=RafaelNikolasPuggi_oficina-producao-service)

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
- **Passo "reserva de estoque" da Saga**: consome `orcamento.aprovado` (RabbitMQ) e devolve `pecas.reservadas` ou `reserva.pecas.falhou` pro `os-service`

Nunca acessa o banco de **OS** ou **Pagamento** diretamente.

## Rodando localmente

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run start:dev
```

Swagger em `http://localhost:3001/docs` (porta diferente do `os-service` para rodar os dois juntos em dev). Precisa do mesmo RabbitMQ (`RABBITMQ_URL`) do `os-service` — ver docker-compose daquele repositório.

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura (gate de CI: mínimo 80% de linhas)
```

## Infraestrutura e deploy

Mesma separação do `os-service`:

- **[`/infra`](infra)** — Terraform (`kind` + Postgres + RabbitMQ), cluster local efêmero, validado de graça a cada push (job `deploy`).
- **[`/k8s`](k8s)** / **[`/k8s-aws`](k8s-aws)** — manifestos de deploy local e real. `k8s-aws` reaproveita o mesmo cluster EKS e a mesma instância RDS do `os-service` (banco lógico `oficina_producao` separado), em vez de provisionar os próprios — mantém o custo da Fase 4 próximo do que já era gasto na Fase 3.
- `type: ClusterIP` apenas — este serviço nunca é exposto publicamente, só chamado de dentro do cluster.
- RabbitMQ real (namespace `oficina-shared`) aplicado de forma idempotente, igual aos outros 2 serviços.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): `build-test` (lint/build/test/cobertura/SonarCloud) → `docker-build-push` → `deploy` (kind efêmero + smoke test) → `deploy-eks` (real, atrás de `AWS_DEPLOY_ENABLED=true`). Branch `main` protegida — PR obrigatório, CI tem que passar.

## Status

Saga completa (RabbitMQ), cobertura de testes acima de 80%, infra como código (local + AWS). Próximas etapas: `oficina-infra-db` ainda precisa publicar as credenciais `/oficina/producao_db_username|password` no SSM pro `deploy-eks` funcionar de ponta a ponta; New Relic; vídeo + PDF de entrega da Fase 4.
