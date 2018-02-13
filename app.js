var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets'),
    mongoose   = require('mongoose'),
    methodOverride = require('method-override'),
    Tick       = require('./models/ticks'),
    Calc       = require('./models/calcs'),
    helperCalc = require('./helpers/calculations');

// web server stuff
var express       = require('express'),
    app           = express(),
    bodyParser    = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});
    

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);

var numberConverter = 100000000;    // one hundred million

var mongologin = "";
if (secrets.mongousr && secrets.mongopwd) {
    mongologin = secrets.mongousr + ':' + secrets.mongopwd + '@';
}
var mongoUrl     = "mongodb://" + mongologin + secrets.mongosvr + ":" + secrets.mongoprt + "/" + secrets.mongodb;
var mongoOptions = {
    useMongoClient: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500
}
mongoose.connect(mongoUrl, mongoOptions);


client.getAccountBalances(function(err, data)
{
    if (err){
        console.log(err.message);
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


function capturePriceData(btcclient, crypto) {
    btcclient.getTick(crypto, "AUD", function(err, data)
    {
        if(!err){
            var timestamp = new Date(Date.now());
            console.log(crypto + ' tick captured ... ' + timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            Tick.create(data, function(err, newData){
                if (err) { console.log(err.message)}
            });
        } else { console.log(err.message); }
    });
}

function analysePriceData(btcclient, crypto) {
    // retrieve last 2000 samplea at 1.5 minutes sample intervals (~2 days)
    var priceArray  = [];
    var queryPrices = Tick.find({'instrument': crypto}).sort({'timestamp': -1}).limit(2000);

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

            helperCalc.updateCalc(btcclient, crypto, min, max, latest);
        }
    });
}

setInterval(capturePriceData.bind(null, client, "BTC"), 60000); // 600000 (10 minutes)
setInterval(capturePriceData.bind(null, client, "ETH"), 60000);
setInterval(capturePriceData.bind(null, client, "LTC"), 60000);
setInterval(capturePriceData.bind(null, client, "BCH"), 60000);
setInterval(capturePriceData.bind(null, client, "XRP"), 60000);
setInterval(capturePriceData.bind(null, client, "ETC"), 60000);

setInterval(analysePriceData.bind(null, client, "BTC"), 90000); //900000 (15 minutes)
setInterval(analysePriceData.bind(null, client, "ETH"), 90000);
setInterval(analysePriceData.bind(null, client, "LTC"), 90000);
setInterval(analysePriceData.bind(null, client, "BCH"), 90000);
setInterval(analysePriceData.bind(null, client, "XRP"), 90000);
setInterval(analysePriceData.bind(null, client, "ETC"), 90000);


// start the web server
var indexRoutes = require('./routes/index');

app.use(indexRoutes);
app.listen(5000, function(){
    console.log("Crypto Trader Server Started");
});