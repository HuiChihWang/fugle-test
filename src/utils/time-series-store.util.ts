import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TimeSeriesStoreUtils {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => 5000,
    });
  }

  async storeData<T>(
    storageName: string,
    key: string,
    data: T,
    timestamp: number,
    ttlSecs: number,
  ) {
    const combinedKey = `${storageName}:${key}`;
    return this.redisClient
      .multi()
      .zadd(combinedKey, timestamp, JSON.stringify(data))
      .expire(combinedKey, ttlSecs)
      .exec();
  }

  async queryData<T>(
    storageName: string,
    key: string,
    from: number,
    to: number,
  ): Promise<T[]> {
    const combinedKey = `${storageName}:${key}`;
    const data = await this.redisClient.zrangebyscore(combinedKey, from, to);
    return data.map((d) => JSON.parse(d) as T);
  }

  async deleteData(storageName: string, key: string) {
    const combinedKey = `${storageName}:${key}`;
    return this.redisClient.del(combinedKey);
  }
}
