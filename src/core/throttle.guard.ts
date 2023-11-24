import {
  ExecutionContext,
  Injectable,
  Logger,
  CanActivate,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryDto } from './core.dto';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly ALLOWED_NUMBER_REQUESTS_SAME_IP_PER_MINUTE = 10;
  private readonly ALLOWED_NUMBER_REQUESTS_SAME_USER_PER_MINUTE = 5;
  private readonly TIMEOUT = 60000;

  private readonly ipRequestsCache = new Map<string, number>();
  private readonly userRequestsCache = new Map<number, number>();

  constructor() {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const ip = request.ip;
    const { user: userId } = request.query as QueryDto;

    const ipRequests = this.ipRequestsCache.get(ip) || 0;
    const userRequests = this.userRequestsCache.get(userId) || 0;

    if (
      ipRequests >= this.ALLOWED_NUMBER_REQUESTS_SAME_IP_PER_MINUTE ||
      userRequests >= this.ALLOWED_NUMBER_REQUESTS_SAME_USER_PER_MINUTE
    ) {
      throw new HttpException(
        {
          ip: ipRequests,
          id: userRequests,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.userRequestsCache.has(userId)) {
      Logger.log(`set limiter for user ${userId}`);
      setTimeout(() => {
        Logger.log(`reset limiter for user ${userId}`);
        this.userRequestsCache.delete(userId);
      }, this.TIMEOUT);
    }

    if (!this.ipRequestsCache.has(ip)) {
      Logger.log(`set limiter for ip ${ip}`);
      setTimeout(() => {
        Logger.log(`reset limiter for ip ${ip}`);
        this.ipRequestsCache.delete(ip);
      }, this.TIMEOUT);
    }

    this.userRequestsCache.set(userId, 1 + userRequests);
    this.ipRequestsCache.set(ip, 1 + ipRequests);

    return true;
  }
}
