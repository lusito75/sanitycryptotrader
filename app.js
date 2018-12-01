const secrets        = require('./secrets.json'),
    BTCMarkets     = require('btc-markets'),
    mongoose       = require('mongoose'),
    methodOverride = require('method-override'),
    LocalStrategy  = require('passport-local'),
    passport       = require('passport'),
    flash          = require('connect-flash'),
    User           = require('./models/user'),
    Tick           = require('./models/tick'),
    Calc           = require('./models/calc'),
    Equity         = require('./models/equity'),
    helperCalc     = require('./helpers/calculations');

// web server stuff
const express       = require('express'),
      app           = express(),
      bodyParser    = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//static routes to npm packages
app.use('/chartjs', express.static(__dirname + '/node_modules/chart.js/dist/'));
app.use('/hammerjs', express.static(__dirname + '/node_modules/hammerjs/')); //pinch gestures
app.use('/chartjszoom', express.static(__dirname + '/node_modules/chartjs-plugin-zoom/'));

app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT CONFIG
app.use(require('express-session')({
    secret: "sspl is gonna get shit done",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next();
});
    

global.numberConverter = 100000000;    // one hundred million - BTC number converter to eliminate decimal values
global.activeUsername = "SanitySoftware";
global.mastermode = false;
global.btcclient = null;
global.mysecret = "";
global.mykey ="";

var mongologin = "";
if (secrets.mongousr && secrets.mongopwd) {
    mongologin = secrets.mongousr + ':' + secrets.mongopwd + '@';
}
const mongoUrl = "mongodb://" + mongologin + secrets.mongosvr + ":" + secrets.mongoprt + "/" + secrets.mongodb;
console.log('connecting to mongodb: '+mongoUrl);
var mongoOptions = {
    useMongoClient: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500
}
mongoose.connect(mongoUrl, mongoOptions);

// var  to store balances temporarily
var equityData = {
    AUD: 0,
    BTCbal: 0,    BTCval: 0,
    ETHbal: 0,    ETHval: 0,
    LTCbal: 0,    LTCval: 0,
    BCHABCbal: 0, BCHABCval: 0,
    BCHSVbal: 0,  BCHSVval: 0,
    XRPbal: 0,    XRPval: 0,
    ETCbal: 0,    ETCval: 0,
    OMGbal: 0, OMGval: 0,
    POWRbal: 0, POWRval: 0,
    TOTval: 0,
    owner: {
        username: activeUsername,
    },
}

function setUpBtcClient() {
    if ((activeUsername !== "SanitySoftware") && (btcclient == null)) {
        User.findOne({username: activeUsername}, function(err, myUser) {
            if (err) {
                console.log(err.message);
            } else {
                mysecret  = myUser.api_secret;
                mykey     = myUser.api_key;
                btcclient = new BTCMarkets(myUser.api_key, myUser.api_secret);
                console.log(activeUsername + ' is logged in, and new BTC client connection established');
            }
        });
    } else if (mysecret && mykey && (btcclient == null)) {
        console.log('user logged off, but this instance will run with previous credentials from last login');
        btcclient = new BTCMarkets(mykey, mysecret);
    } else if (secrets.api_key && secrets.api_secret && (btcclient == null)) {
        console.log('master instance - setup BTC client with Sanity Software default params')
        mastermode = true;
        btcclient = new BTCMarkets(secrets.api_key, secrets.api_secret);
    }
}

// function to capture price ticks from BTCmarkets
function capturePriceData(crypto) {
    setUpBtcClient();
    if (btcclient == null) {
        console.log('no BTC client setup - waiting to capture prices ...');
    }
    else {
        btcclient.getTick(crypto, "AUD", function(err, data) {
            if(!err){
                var timestamp = new Date(Date.now());
                switch (data.instrument) {
                    case "BTC":
                        equityData.BTCval = (equityData.BTCbal * data.lastPrice) / numberConverter;                            
                        break;                    
                    case "ETH":
                        equityData.ETHval = (equityData.ETHbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "LTC":
                        equityData.LTCval = (equityData.LTCbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "BCHABC":
                        equityData.BCHABCval = (equityData.BCHABCbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "BCHSV":
                        equityData.BCHSVval = (equityData.BCHSVbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "XRP":
                        equityData.XRPval = (equityData.XRPbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "ETC":
                        equityData.ETCval = (equityData.ETCbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "OMG":
                        equityData.OMGval = (equityData.OMGbal * data.lastPrice) / numberConverter;                            
                        break;
                    case "POWR":
                        equityData.POWRval = (equityData.POWRbal * data.lastPrice) / numberConverter;                            
                        break;
                }
                equityData.TOTval = equityData.AUD + equityData.BTCval + equityData.ETHval
                                     + equityData.LTCval + equityData.BCHABCval + equityData.BCHSVval + equityData.XRPval
                                     + equityData.ETCval + equityData.OMGval + equityData.POWRval;
                if ( (activeUsername === "SanitySoftware") || (activeUsername === "paulo@lourenco.net.au") || (secrets.mongosvr === "localhost") ) {
                    // only create a new price tick in db if master user or local instance
                    Tick.create(data, function(err, newData){
                        if (err) { console.log(err.message); } else { console.log(crypto + ' tick captured ... ' + timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, '')); }
                    });
                }
            } else { console.log(err.message); }
        });
    }
}

// function to update trade calculations based on recent price data
function analysePriceData(crypto) {
    setUpBtcClient();
    // retrieve last 2000 samples at 1.5 minutes sample intervals (~2 days)
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

            if (btcclient != null) {
                helperCalc.updateCalc(btcclient, crypto, min, max, latest);
                console.log(crypto + ' analysed ... ' + timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
            } else { console.log('no BTC client setup - waiting to update calculations') }
        }
    });
}

// gets all account balances, store in global equityData var
// push this equity amount into db model "Equity"
function updateEquityData() {
    setUpBtcClient();
    var crypto = "";
    if (btcclient == null) {
        console.log('no BTC client setup - waiting to update equity ...');
    }
    else {
            // get all account balances
        btcclient.getAccountBalances(function(err, data) {
            if (err) {
                console.log(err.message);
            }
            else {
                data.forEach(function(account) {
                    console.log(account.currency + ' balance ' + account.balance / numberConverter);
                    crypto = account.currency;
                    equityData.owner.username = activeUsername;
                    switch (crypto) {
                        case "BTC":
                            equityData.BTCbal = account.balance;                            
                            break;                    
                        case "ETH":
                            equityData.ETHbal = account.balance;                            
                            break;
                        case "LTC":
                            equityData.LTCbal = account.balance;                            
                            break;
                        case "BCHABC":
                            equityData.BCHABCbal = account.balance;                            
                            break;
                        case "BCHSV":
                            equityData.BCHSVbal = account.balance;                            
                            break;
                        case "XRP":
                            equityData.XRPbal = account.balance;                            
                            break;
                        case "ETC":
                            equityData.ETCbal = account.balance;                            
                            break;
                        case "OMG":
                            equityData.OMGbal = account.balance;                            
                            break;
                        case "POWR":
                            equityData.POWRbal = account.balance;                            
                            break;
                        case "AUD":
                            equityData.AUD = account.balance / numberConverter;
                            break;
                        }
                });  // close of forEach loop
                if (equityData.TOTval) {
                    console.log('TOTAL portfolio Value: $' + equityData.TOTval.toFixed(2));
                    Equity.create(equityData, function(err, newData){
                        if (err) { console.log(err.message)}
                    });
                }            
            }
        }); // close of account GET call
    }
}



setInterval(capturePriceData.bind(null, "BTC"),    60000); // 60000 (1 minute / 60s)
setInterval(capturePriceData.bind(null, "ETH"),    60000);
setInterval(capturePriceData.bind(null, "LTC"),    60000);
setInterval(capturePriceData.bind(null, "BCHABC"), 60000);
setInterval(capturePriceData.bind(null, "BCHSV"),  60000);
setInterval(capturePriceData.bind(null, "XRP"),    60000);
setInterval(capturePriceData.bind(null, "ETC"),    60000);
setInterval(capturePriceData.bind(null, "OMG"),    60000);
setInterval(capturePriceData.bind(null, "POWR"),   60000);

setInterval(analysePriceData.bind(null, "BTC"),    90000); //90000 (1.5 minute / 90s)
setInterval(analysePriceData.bind(null, "ETH"),    90000);
setInterval(analysePriceData.bind(null, "LTC"),    90000);
setInterval(analysePriceData.bind(null, "BCHABC"), 90000);
setInterval(analysePriceData.bind(null, "BCHSV"),  90000);
setInterval(analysePriceData.bind(null, "XRP"),    90000);
setInterval(analysePriceData.bind(null, "ETC"),    90000);
setInterval(analysePriceData.bind(null, "OMG"),    90000);
setInterval(analysePriceData.bind(null, "POWR"),   90000);

//update equity data
setInterval(updateEquityData.bind(null), 216000); //21600000 (6 hours)

setUpBtcClient();

// start the web server
var indexRoutes = require('./routes/index');
var dbRoutes    = require('./routes/data');

app.use(indexRoutes);
app.use(dbRoutes);

app.listen(5050, function(){
    console.log("Crypto Trader Server Started");
});