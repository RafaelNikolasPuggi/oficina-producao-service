import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

/** Usado pelos endpoints internos de resolução de catálogo (chamados pelo os-service). */
export class BuscarPorIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  ids: string[];
}
