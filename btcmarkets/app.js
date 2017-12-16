var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets'),
    mongoose   = require('mongoose'),
    Tick       = require('./models/ticks');

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);

var numberConverter = 100000000;    // one hundred million

var mongoUrl  = process.env.DATABASEURL || "mongodb://localhost/cryptotrader";
mongoose.connect(mongoUrl);


client.getAccountBalances(function(err, data)
{
    if (err){
        console.log(err);
    }
    else {
        console.log('\n\n');
        data.forEach(function(account)
        {
            console.log(account.currency + ' balance ' + account.balance / numberConverter + ' pending ' + account.pendingFunds / numberConverter);
        });
        console.log('\n\n\n');
    }
});


function capturePriceData(btcclient, crypto, currency) {
    btcclient.getTick(crypto, currency, function(err, data)
    {
        if(!err){
            console.log(data);
            console.log('\n\n\n');
            Tick.create(data, function(err, newData){
                if (err) { console.log(err)}
            });
        }
    });
}

setInterval(capturePriceData.bind(null, client, "BTC", "AUD"), 120000);
setInterval(capturePriceData.bind(null, client, "ETH", "AUD"), 120000);
setInterval(capturePriceData.bind(null, client, "LTC", "AUD"), 120000);