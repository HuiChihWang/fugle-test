## Description

Project for frugle test, including API, Rate Limiter, Socket.io, Redis, Swagger, etc.

## Requirements
1. @nestjs/cli
2. pnpm
3. Redis

```bash
$ npm install -g @nestjs/cli
$ npm install -g pnpm
$ docker run --name redis -p 6379:6379 -d redis
```
## Installation

```bash
$ pnpm install
```

## Running the app

```bash
$ pnpm run start:dev
```

## Swagger 
[swagger-link](http://localhost:3000/api)

## Socket (socket.io) Usage
1. subscribe/unsubscribe (maximum 10 subscription allowed)
```json
// event: subscribe
{
  "currencyPairs": [
    "btcusd"
  ]
}
```
```json
// event: unsubscribe
{
  "currencyPairs": [
    "btcusd"
  ]
} 
```

2. subscription response (event_name: currency_pair)

```ts
{
  data: {
    amount: number;
    buy_order_id: number;
    id: number;
    sell_order_id: number;
    timestamp: number;
    price: number;
    type: number;
  },
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
  }
}
```

## License

Nest is [MIT licensed](LICENSE).
