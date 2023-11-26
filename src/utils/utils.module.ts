import { Module } from '@nestjs/common';
import { TimeSeriesStoreUtils } from './time-series-store.util';

@Module({
  imports: [],
  providers: [TimeSeriesStoreUtils],
  exports: [TimeSeriesStoreUtils],
})
export class UtilsModule {}
