var secrets = require('./secrets.json');

var BTCMarkets = require('btc-markets');

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);

var numberConverter = 100000000;    // one hundred million

// get latest prices
// client.getTick("BTC", "AUD", function(err, data)
// {
//     console.log('BTC / AUD bid ' + data.bestBid + ' ask ' + data.bestAsk + ' last price ' + data.lastPrice);
//     console.log(data);
// });

// client.getAccountBalances(function(err, data)
// {
//     if (err){
//         console.log(err);
//     }
//     else {
//         data.forEach(function(account)
//         {
//             console.log(account.currency + ' balance ' + account.balance / numberConverter + ' pending ' + account.pendingFunds / numberConverter);
//         });
//     }
// });

// client.getTradingFee("BTC", "AUD", function(err, data)
// {
//     if (!err) {
//         console.log("BTC/AUD trading fee: " + data);
//     }
// });

function logPriceToFile(btcclient, crypto, currency) {
    btcclient.getTick(crypto, currency, function(err, data)
    {
        if(!err){
            console.log(data);
        }
    });
}

setInterval(logPriceToFile.bind(null, client, "BTC", "AUD"), 5000);