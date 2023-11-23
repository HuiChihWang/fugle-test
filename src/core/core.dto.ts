import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDto {
  @IsInt()
  @Type(() => Number)
  readonly user: number;
}

export class ResultResponse {
  readonly result: number[];
}
