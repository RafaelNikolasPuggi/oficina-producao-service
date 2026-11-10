import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { ClientProxy } from '@nestjs/microservices';
import { OS_QUEUE_CLIENT } from '../../../../messaging/messaging.module';
import { InsufficientStockException } from '../../../../shared/domain/exceptions';
import { PecasService } from '../../application/pecas.service';

interface OrcamentoAprovadoEvent {
  ordemServicoId: string;
  itens: { pecaId: string; quantidade: number }[];
}

/**
 * Passo "reserva de estoque" da Saga, visto do lado do producao-service:
 * consome `orcamento.aprovado` (fila `producao_queue`) e devolve o
 * resultado pro os-service via `os_queue` — sucesso (`pecas.reservadas`)
 * ou falta de peça (`reserva.pecas.falhou`, com o detalhe pra
 * compensação).
 */
@Controller()
export class PecasEventsController {
  private readonly logger = new Logger(PecasEventsController.name);

  constructor(
    private readonly pecasService: PecasService,
    @Inject(OS_QUEUE_CLIENT) private readonly osClient: ClientProxy,
  ) {}

  @EventPattern('orcamento.aprovado')
  async aoAprovarOrcamento(
    @Payload() evento: OrcamentoAprovadoEvent,
  ): Promise<void> {
    try {
      await this.pecasService.reservarEstoque(evento.itens);
      this.osClient.emit('pecas.reservadas', {
        ordemServicoId: evento.ordemServicoId,
      });
    } catch (error) {
      if (error instanceof InsufficientStockException) {
        this.osClient.emit('reserva.pecas.falhou', {
          ordemServicoId: evento.ordemServicoId,
          pecaNome: error.pecaNome,
          disponivel: error.disponivel,
          solicitado: error.solicitado,
        });
        return;
      }
      this.logger.error(
        `Falha inesperada ao reservar estoque da OS ${evento.ordemServicoId}: ${(error as Error).message}`,
      );
    }
  }
}
