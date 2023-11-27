import {
  ArgumentMetadata,
  Injectable,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    try {
      return await super.transform(value, metadata);
    } catch (e: any) {
      throw new WsException(e.getResponse());
    }
  }
}
