import { Injectable } from '@nestjs/common';
import { APIService } from './api.service';

@Injectable()
export class CoreService {
  constructor(private readonly apiService: APIService) {}

  async getDividableNumbers(input: number) {
    const candidates = await this.apiService.getContent();
    return candidates.filter((candidate) => candidate % input === 0);
  }
}
