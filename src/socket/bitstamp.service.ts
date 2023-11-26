import * as WebSocket from 'ws';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  OHLCData,
  TickerSocketMessageFromBitstamp,
  TradeDataToUser,
  TradeDataFromBitstamp,
} from './socket.dto';
import { TimeSeriesStoreUtils } from '../utils/time-series-store.util';

type TickerSocketCallback = (message: {
  data: TradeDataToUser;
  currencyPair: string;
  subscriptions: Set<string>;
}) => void;

@Injectable()
export class BitstampService implements OnModuleInit {
  static readonly SOCKET_URL = 'wss://ws.bitstamp.net';
  static readonly OHLC_EXPIRE_TIME_SECONDS = 60 * 15;
  static readonly OHLC_STATISTICS_WINDOW_MINUTES = 1;

  private socket: WebSocket;

  private readonly registrations: Map<string, Set<string>> = new Map();
  private readonly subscriptions: Map<string, Set<string>> = new Map();
  private callback: TickerSocketCallback = () => {};

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

      const currencyPair = message.channel.split('_')[2];
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

  getSubscriptions(id: string): Set<string> {
    return this.subscriptions.get(id) || new Set();
  }

  subscribe(id: string, currencyPair: string) {
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
            return Logger.error(error);
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

  unsubscribe(id: string, currencyPair: string) {
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
          return Logger.error(error);
        }
        this.registrations.delete(currencyPair);
        this.timeSeriesStoreUtils.deleteData('ohlc', currencyPair);
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
    currencyPair: string,
  ): Promise<TradeDataToUser> {
    await this.timeSeriesStoreUtils.storeData<TradeDataFromBitstamp>(
      'ohlc',
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
        'ohlc',
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
