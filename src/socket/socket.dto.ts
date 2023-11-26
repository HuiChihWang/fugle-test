export class SubscribePriceMessage {
  readonly currencyPairs: string[];
}

export class OHLCData {
  readonly timestamp: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export class TradeDataFromBitstamp {
  readonly amount: number;
  readonly buy_order_id: number;
  readonly id: number;
  readonly sell_order_id: number;
  readonly timestamp: number;
  readonly price: number;
  readonly type: number;
}

export class TickerSocketMessageFromBitstamp {
  readonly data: TradeDataFromBitstamp;
  readonly event: string;
  readonly channel: string;
}

export class TradeDataToUser {
  readonly data: TradeDataFromBitstamp;
  readonly ohlc: OHLCData;
}
