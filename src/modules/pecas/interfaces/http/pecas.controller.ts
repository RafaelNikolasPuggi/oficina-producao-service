import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { BuscarPorIdsDto } from '../../../../shared/dto/buscar-por-ids.dto';
import { PaginationQueryDto } from '../../../../shared/dto/pagination.dto';
import { InsufficientStockException } from '../../../../shared/domain/exceptions';
import { PecasService } from '../../application/pecas.service';
import { AjustarEstoqueDto } from './dto/ajustar-estoque.dto';
import { CreatePecaDto } from './dto/create-peca.dto';
import { PecaResponseDto } from './dto/peca-response.dto';
import { ReservarEstoqueDto } from './dto/reservar-estoque.dto';
import { UpdatePecaDto } from './dto/update-peca.dto';

@ApiTags('Peças')
@Controller('pecas')
export class PecasController {
  constructor(private readonly pecasService: PecasService) {}

  /**
   * Endpoints internos (chamados pelo os-service) — sem JwtAuthGuard porque
   * não são acessados por um usuário final, só por outro serviço dentro da
   * rede do cluster.
   */
  @Post('buscar-por-ids')
  @ApiExcludeEndpoint()
  async buscarPorIds(@Body() dto: BuscarPorIdsDto): Promise<PecaResponseDto[]> {
    const pecas = await this.pecasService.buscarPorIds(dto.ids);
    return pecas.map((item) => PecaResponseDto.fromDomain(item));
  }

  /**
   * Reserva o estoque de uma ou mais peças (transação atômica). Retorna 409
   * com o detalhe estruturado da falta quando alguma peça não tem estoque
   * suficiente — o `os-service` usa esse corpo para reconstruir a exceção de
   * domínio e manter a OS em AGUARDANDO_APROVACAO (compensação da Saga).
   */
  @Post('reservar-estoque')
  @ApiExcludeEndpoint()
  async reservarEstoque(
    @Body() dto: ReservarEstoqueDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.pecasService.reservarEstoque(dto.itens);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      if (error instanceof InsufficientStockException) {
        res.status(HttpStatus.CONFLICT).json({
          pecaNome: error.pecaNome,
          disponivel: error.disponivel,
          solicitado: error.solicitado,
        });
        return;
      }
      throw error;
    }
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cadastra uma peça no catálogo/estoque' })
  async criar(@Body() dto: CreatePecaDto): Promise<PecaResponseDto> {
    const peca = await this.pecasService.criar(dto);
    return PecaResponseDto.fromDomain(peca);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista as peças do catálogo' })
  async listar(@Query() query: PaginationQueryDto) {
    const resultado = await this.pecasService.listar(query.page, query.limit);
    return {
      ...resultado,
      items: resultado.items.map((item) => PecaResponseDto.fromDomain(item)),
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consulta uma peça pelo id' })
  async obter(@Param('id') id: string): Promise<PecaResponseDto> {
    const peca = await this.pecasService.obter(id);
    return PecaResponseDto.fromDomain(peca);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza dados cadastrais de uma peça' })
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdatePecaDto,
  ): Promise<PecaResponseDto> {
    const peca = await this.pecasService.atualizar(id, dto);
    return PecaResponseDto.fromDomain(peca);
  }

  @Patch(':id/estoque')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ajusta manualmente a quantidade em estoque de uma peça',
  })
  async ajustarEstoque(
    @Param('id') id: string,
    @Body() dto: AjustarEstoqueDto,
  ): Promise<PecaResponseDto> {
    const peca = await this.pecasService.ajustarEstoque(id, dto.delta);
    return PecaResponseDto.fromDomain(peca);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma peça do catálogo' })
  async remover(@Param('id') id: string): Promise<void> {
    await this.pecasService.remover(id);
  }
}
