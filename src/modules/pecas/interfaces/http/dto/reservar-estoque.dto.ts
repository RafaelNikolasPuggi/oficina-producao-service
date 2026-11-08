import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemReservaEstoqueDto {
  @ApiProperty()
  @IsString()
  pecaId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantidade: number;
}

/**
 * Endpoint interno chamado pelo os-service ao aprovar um orçamento — reserva
 * (decrementa) o estoque de várias peças em uma única transação atômica.
 */
export class ReservarEstoqueDto {
  @ApiProperty({ type: [ItemReservaEstoqueDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemReservaEstoqueDto)
  itens: ItemReservaEstoqueDto[];
}
