# README #

### What is this repository for? ###

* Crypto Trader - a robot for trading crypto currencies automatically and autonomously.
* nodejs web application
* designed for use with [BTC Markets](https://btcmarkets.net) (Australian/AUD exchange)

### Setup? ###

* Clone
* configure a `secrets.json` file:
~~~~
{
    "api_key"    : "",
    "api_secret" : "",
    "mongousr"   : "",
    "mongopwd"   : "",
    "mongosvr"   : "",
    "mongoprt"   : "",
    "mongodb"    : "",
    "emailuser"  : "",
    "emailpass"  : ""
 }
 ~~~~
* `npm install` followed by `nodemon` or `npm start`

### Features ###

* Enable/Disable trading (ie no buying/selling will take place - just observing the market)
* Enable/Disable auto-stop loss (ie sell when profits less than negative 2 * target margin)
* Enable/Disable Dollar Cost Averaging (DCA), aka "Average Down" (ie buy back in if profits are lower than negative 1.25 * target margin)
* Pump'n Dump mode - only allow a buy if the price has returned to recent minimum levels - assuming the market is just on a roller-coaster ride. Disable this if you observe a sustained growth pattern
* tweak your target margin (ie increase or decrease the profit % you would like to achieve before buys/sells)
* tweak your "Recommended Action" (ie forcefully "suggest" to Average Down or Sell now panic sell)

