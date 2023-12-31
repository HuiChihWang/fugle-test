import {
  Controller,
  Get,
  HttpException,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottleGuard } from './throttle.guard';
import { CoreService } from './core.service';
import { QueryDto, ResultResponse } from './core.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Core')
@Controller()
@UseGuards(ThrottleGuard)
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @ApiOperation({ summary: 'Get dividable numbers' })
  @Get('/data')
  async getList(@Query() query: QueryDto): Promise<ResultResponse> {
    try {
      const dividableLists = await this.coreService.getDividableNumbers(
        query.user,
      );
      return {
        result: dividableLists,
      };
    } catch (error) {
      Logger.error(error);
      throw new HttpException(error.message, 500);
    }
  }
}
