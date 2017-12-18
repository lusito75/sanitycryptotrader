var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets'),
    mongoose   = require('mongoose'),
    Tick       = require('./models/ticks'),
    Calc       = require('./models/calcs')

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
            // console.log(crypto + ' sample MIN: ' + min + ' sample MAX: ' + max + ' latest: ' + latest);
            var timestamp = new Date(Date.now());
            console.log(crypto + ' analysed ... ' + timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, ''));

            // retrieve latest calcs for crypto
            Calc.findOneAndUpdate({'instrument': crypto}, {'instrument': crypto}, {upsert:true}, function(err, myCalc){
                if (err) {
                    console.log(err.message);
                } else {
                // update longTermMin and longTermMax if relevant
                if (!myCalc.longTermMin) {
                    myCalc.longTermMin = min;
                }
                else if (min < myCalc.longTermMin){
                    myCalc.longTermMin = min;
                }
                if (!myCalc.longTermMax) {
                    myCalc.longTermMax = max;
                }
                else if (max > myCalc.longTermMax){
                    myCalc.longTermMax = max;
                }
                if (myCalc.lastAction === "buy"){
                    var profit = ((latest - myCalc.lastPrice) / myCalc.lastPrice)*100;
                    if (profit >= 10){
                        console.log(crypto + " SELL for " + profit +"% @" + latest);
                        //update lastPrice, update lastAction, average out running profit
                        myCalc.lastPrice = latest;
                        myCalc.lastAction = "sell";
                        var avg = (myCalc.runningProfit + profit) / 2;
                        myCalc.runningProfit = avg;
                    }
                }
                else if (myCalc.lastAction === "sell"){
                    //
                    if (latest <= min){
                        console.log(crypto + " lowest value in last week: @" + latest + " BUY moderate");
                        if (latest <= myCalc.longTermMin) {
                            console.log(crypto + " lowest value on record: @" + latest + " BUY strong");
                        }
                        // console.log(crypto + " BUY for " + latest);
                        //update lastPrice, update lastAction
                    }
                    if (latest <= max){
                        console.log(crypto + " latest price lower than last week peak: @" + latest + " BUY moderate");
                        if (latest <= myCalc.longTermMax) {
                            console.log(crypto + " latest price lower than recorded peak: @" + latest + " BUY strong");
                        }
                        // console.log(crypto + " BUY for " + latest);
                        //update lastPrice, update lastAction
                    }
                }
                // if latest < longTermMin
                // --> if myCalc.trend === "falling" --> still falling
                // --> else if myCalc.trend === "rising" --> reset to falling, sell at latest(?)
                // if latest > longTermMax
                // --> if myCalc.trend === "rising" --> still rising
                // --> else if myCalc.trend === "falling" --> reset to rising, buy at latest(?)
                //
                myCalc.save();
                }
            });


        }
    });


}

setInterval(capturePriceData.bind(null, client, "BTC", "AUD"), 600000);
setInterval(capturePriceData.bind(null, client, "ETH", "AUD"), 600000);
setInterval(capturePriceData.bind(null, client, "LTC", "AUD"), 600000);

setInterval(analysePriceData.bind(null, "BTC"), 900000);
setInterval(analysePriceData.bind(null, "ETH"), 900000);
setInterval(analysePriceData.bind(null, "LTC"), 900000);
