var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets'),
    mongoose   = require('mongoose'),
    Tick       = require('./models/ticks'),
    Calc       = require('./models/calcs'),
    helperCalc = require('./helpers/calculations');

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
            console.log(crypto + ' tick captured ...');
            console.log('\n');
            Tick.create(data, function(err, newData){
                if (err) { console.log(err)}
            });
        }
    });
}

function analysePriceData(crypto) {
    // retrieve last 1000 sample limit at 10 minutes sample intervals (~7 days)
    var priceArray  = [];
    var queryPrices = Tick.find({'instrument': crypto}).sort({'timestamp': -1}).limit(1000);

    queryPrices.exec(function (err, latestTicks){
        if (err) {
            console.log(err.message);
        } else {
            // push lastPrice to local array
            latestTicks.forEach(function(price){
                priceArray.push(price.lastPrice);
            });

            // lets get max / min for last 1000 samples
            var min    = Math.min.apply(null, priceArray ),
                max    = Math.max.apply(null, priceArray );
                latest = priceArray[0];
            // console.log(crypto + ' min: ' + min + ' max: ' + max + ' latest: ' + latest);
            var timestamp = new Date(Date.now());
            console.log(crypto + ' analysed ... ' + timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            console.log('\n');

            helperCalc.updateCalc(crypto, min, max, latest);
        }
    });
}

setInterval(capturePriceData.bind(null, client, "BTC", "AUD"), 600000);
setInterval(capturePriceData.bind(null, client, "ETH", "AUD"), 600000);
setInterval(capturePriceData.bind(null, client, "LTC", "AUD"), 600000);

setInterval(analysePriceData.bind(null, "BTC"), 10000); //900000 (15 minutes)
setInterval(analysePriceData.bind(null, "ETH"), 10000);
setInterval(analysePriceData.bind(null, "LTC"), 10000);
