import * as WebSocket from 'ws';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  OHLCData,
  TickerSocketMessageFromBitstamp,
  TradeDataToUser,
  TradeDataFromBitstamp,
} from './socket.dto';
import { TimeSeriesStoreUtils } from '../utils/time-series-store.util';
import { CurrencyPair } from './currecy-pair.enum';

type TickerSocketCallback = (message: {
  data: TradeDataToUser;
  currencyPair: CurrencyPair;
  subscriptions: Set<string>;
}) => void;

type TickerSocketFallback = (id: string, error: Error | string) => void;

@Injectable()
export class BitstampService implements OnModuleInit {
  static readonly SOCKET_URL = 'wss://ws.bitstamp.net';
  static readonly OHLC_EXPIRE_TIME_SECONDS = 60 * 15;
  static readonly OHLC_STATISTICS_WINDOW_MINUTES = 1;

  private socket: WebSocket;

  private readonly registrations: Map<CurrencyPair, Set<string>> = new Map();
  private readonly subscriptions: Map<string, Set<CurrencyPair>> = new Map();
  private callback: TickerSocketCallback = () => {};
  private fallback: TickerSocketFallback = () => {};
  constructor(private readonly timeSeriesStoreUtils: TimeSeriesStoreUtils) {}

  onModuleInit() {
    this.socket = new WebSocket(BitstampService.SOCKET_URL);
    this.socket.on('open', () => {
      Logger.log('connected to bitstamp');
    });

    this.socket.on('close', () => {
      Logger.log('disconnected from bitstamp');
    });

    this.socket.on('message', (data) => {
      const message = JSON.parse(
        data.toString(),
      ) as TickerSocketMessageFromBitstamp;

      if (message.event !== 'trade') {
        return;
      }

      const currencyPairStr = message.channel.split('_')[2];
      const currencyPair = CurrencyPair[currencyPairStr.toUpperCase()];
      const subscriptions = this.registrations.get(currencyPair) || new Set();

      const extractedData: TradeDataFromBitstamp = {
        timestamp: message.data.timestamp,
        price: message.data.price,
      };

      this.processTradeMessage(extractedData, currencyPair).then(
        (tradeData) => {
          this.callback({
            data: tradeData,
            currencyPair,
            subscriptions,
          });
        },
      );
    });
  }

  setCallback(callback: TickerSocketCallback) {
    this.callback = callback;
  }

  setFallback(fallback: TickerSocketFallback) {
    this.fallback = fallback;
  }

  getSubscriptions(id: string): Set<string> {
    return this.subscriptions.get(id) || new Set();
  }

  subscribe(id: string, currencyPair: CurrencyPair) {
    const registration = this.registrations.get(currencyPair) || new Set();
    const subscriptions = this.subscriptions.get(id) || new Set();

    if (subscriptions)
      if (registration.size === 0) {
        const payload = {
          event: 'bts:subscribe',
          data: {
            channel: `live_trades_${currencyPair}`,
          },
        };
        this.socket.send(JSON.stringify(payload), (error) => {
          if (error) {
            return this.fallback(id, error);
          }
          Logger.log(`subscribed to bitstamp: ${currencyPair}`);
          registration.add(id);
          subscriptions.add(currencyPair);
          this.registrations.set(currencyPair, registration);
          this.subscriptions.set(id, subscriptions);
        });
      } else {
        registration.add(id);
        subscriptions.add(currencyPair);
        this.registrations.set(currencyPair, registration);
        this.subscriptions.set(id, subscriptions);
      }
  }

  unsubscribe(id: string, currencyPair: CurrencyPair) {
    if (!this.registrations.has(currencyPair)) {
      return;
    }
    const registration = this.registrations.get(currencyPair);
    const subscriptions = this.subscriptions.get(id);

    registration.delete(id);
    subscriptions.delete(currencyPair);

    if (registration.size === 0) {
      const payload = {
        event: 'bts:unsubscribe',
        data: {
          channel: `live_trades_${currencyPair}`,
        },
      };
      this.socket.send(JSON.stringify(payload), (error) => {
        if (error) {
          return this.fallback(id, error);
        }
        this.registrations.delete(currencyPair);
        Logger.log(`unsubscribed from bitstamp: ${currencyPair}`);
      });
    }
  }

  unregisterAll(id: string) {
    const subscriptions = this.subscriptions.get(id) || new Set();
    for (const currencyPair of subscriptions) {
      this.unsubscribe(id, currencyPair);
    }
  }

  private async processTradeMessage(
    data: TradeDataFromBitstamp,
    currencyPair: CurrencyPair,
  ): Promise<TradeDataToUser> {
    await this.timeSeriesStoreUtils.storeData<TradeDataFromBitstamp>(
      'trade',
      currencyPair,
      data,
      data.timestamp,
      BitstampService.OHLC_EXPIRE_TIME_SECONDS,
    );

    const ohlcData = await this.getOHLCData(
      currencyPair,
      data.timestamp,
      BitstampService.OHLC_STATISTICS_WINDOW_MINUTES,
    );

    await this.timeSeriesStoreUtils.storeData<OHLCData>(
      'ohlc',
      currencyPair,
      ohlcData,
      ohlcData.timestamp,
      BitstampService.OHLC_EXPIRE_TIME_SECONDS,
    );

    return {
      currencyPair,
      timestamp: data.timestamp,
      price: data.price,
      ohlc: ohlcData,
    };
  }

  private async getOHLCData(
    currencyPair: string,
    currentTimeStampSecs: number = Date.now(),
    inMinutes: number = 1,
  ): Promise<OHLCData> {
    const dataInRange =
      await this.timeSeriesStoreUtils.queryData<TradeDataFromBitstamp>(
        'trade',
        currencyPair,
        currentTimeStampSecs - inMinutes * 60,
        currentTimeStampSecs,
      );

    if (!dataInRange || dataInRange.length === 0) {
      return null;
    }

    let high = dataInRange[0].price;
    let low = dataInRange[0].price;

    for (const data of dataInRange) {
      high = Math.max(high, data.price);
      low = Math.min(low, data.price);
    }

    return {
      timestamp: currentTimeStampSecs,
      open: dataInRange[0].price,
      high,
      low,
      close: dataInRange[dataInRange.length - 1].price,
    };
  }
}
