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

2. subscription response (event_name: `trade`)

```ts
{
  currencyPair: string;
  timestamp: number;
  price: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
  }
}
```
3. error response (event_name: `error`)


3. available currency pairs
```
btcusd, btceur, btcgbp, btcpax, gbpusd, eurusd, xrpusd, xrpeur, xrpbtc, xrpgbp, 
ltcbtc, ltcusd, ltceur, ltcgbp, ethbtc, ethusd, etheur, ethgbp, ethpax, bchusd, 
bcheur, bchbtc, paxusd, xlmbtc, xlmusd, xlmeur, xlmgbp, linkusd, linkeur, linkgbp, 
linkbtc, usdcusd, usdceur, btcusdc, ethusdc, eth2eth, aaveusd, aaveeur, aavebtc, 
batusd, bateur, umausd, umaeur, daiusd, kncusd, knceur, mkrusd, mkreur, zrxusd, zrxeur, 
gusdusd, algousd, algoeur, algobtc, audiousd, audioeur, audiobtc, crvusd, crveur, snxusd, 
snxeur, uniusd, unieur, unibtc, yfiusd, yfieur, compusd, compeur, grtusd, grteur, lrcusd, 
lrceur, usdtusd, usdteur, usdcusdt, btcusdt, ethusdt, xrpusdt, eurteur, eurtusd, flrusd, 
flreur, manausd, manaeur, maticusd, maticeur, sushiusd, sushieur, chzusd, chzeur, enjusd, 
enjeur, hbarusd, hbareur, alphausd, alphaeur, axsusd, axseur, sandusd, sandeur, storjusd, 
storjeur, adausd, adaeur, adabtc, fetusd, feteur, sklusd, skleur, slpusd, slpeur, sxpusd, 
sxpeur, sgbusd, sgbeur, avaxusd, avaxeur, dydxusd, dydxeur, ftmusd, ftmeur, shibusd, shibeur, 
ampusd, ampeur, ensusd, enseur, galausd, galaeur, perpusd, perpeur, wbtcbtc, ctsiusd, ctsieur, 
cvxusd, cvxeur, imxusd, imxeur, nexousd, nexoeur, antusd, anteur, godsusd, godseur, radusd, 
radeur, bandusd, bandeur, injusd, injeur, rlyusd, rlyeur, rndrusd, rndreur, vegausd, vegaeur, 
1inchusd, 1incheur, solusd, soleur, apeusd, apeeur, mplusd, mpleur, eurocusdc, euroceur, dotusd, 
doteur, nearusd, neareur, ldousd, ldoeur, dgldusd, dgldeur, dogeusd, dogeeur, suiusd, suieur, pyusdusd, 
pyusdeur
```

## License

Nest is [MIT licensed](LICENSE).
