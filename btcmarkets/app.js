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
            // console.log(data);
            // console.log('\n\n\n');
            Tick.create(data, function(err, newData){
                if (err) { console.log(err)}
            });
        }
    });
}

function analysePriceData(crypto) {
    // retrieve latest calcs for crypto
    // retrieve last (?) price ticks
    var priceArray  = [];
    var queryPrices = Tick.find({'instrument': crypto}).sort({'timestamp': -1}).limit(50);

    queryPrices.exec(function (err, latestTicks){
        if (err) {
            console.log(err.message);
        } else {
            // push lastPrice to local array
            latestTicks.forEach(function(price){
                priceArray.push(price.lastPrice);
            });
            // console.log('latest '+crypto+' prices: '+priceArray);
            
            // do stuff
            var min    = Math.min.apply(null, priceArray ),
                max    = Math.max.apply(null, priceArray );
                latest = priceArray[0];
            console.log(crypto + ' sample MIN: ' + min + ' sample MAX: ' + max + ' latest: ' + latest);
            console.log('\n');
        }
    });



}

setInterval(capturePriceData.bind(null, client, "BTC", "AUD"), 120000);
setInterval(capturePriceData.bind(null, client, "ETH", "AUD"), 120000);
setInterval(capturePriceData.bind(null, client, "LTC", "AUD"), 120000);

setInterval(analysePriceData.bind(null, "BTC"), 10000);
setInterval(analysePriceData.bind(null, "ETH"), 10000);
setInterval(analysePriceData.bind(null, "LTC"), 10000);