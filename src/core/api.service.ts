import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map, throwError } from 'rxjs';

@Injectable()
export class APIService {
  constructor(private readonly httpService: HttpService) {}

  async getContent() {
    const responseObservable = this.httpService
      .get<number[]>(
        'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty',
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => throwError(() => error)),
      );

    return firstValueFrom(responseObservable);
  }
}
