import { CurrencyPair } from './currecy-pair.enum';
import { IsEnum } from 'class-validator';

export class SubscribePriceMessage {
  @IsEnum(CurrencyPair, { each: true, message: 'Invalid currency pair' })
  readonly currencyPairs: CurrencyPair[];
}

export class OHLCData {
  readonly timestamp: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export class TradeDataFromBitstamp {
  readonly timestamp: number;
  readonly price: number;
}

export class TickerSocketMessageFromBitstamp {
  readonly data: TradeDataFromBitstamp;
  readonly event: string;
  readonly channel: string;
}

export class TradeDataToUser {
  readonly currencyPair: CurrencyPair;
  readonly timestamp: number;
  readonly price: number;
  readonly ohlc: OHLCData;
}
