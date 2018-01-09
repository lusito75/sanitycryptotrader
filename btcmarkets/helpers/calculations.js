// helper object
var Calc   = require('../models/calcs');

var helperObj = {};

// BTC client number converter
var numberConverter = 100000000;    // one hundred million


function truncateString (inputStr, strlength) {
    if (inputStr.length > strlength) {
        var tmpStr = inputStr.substring(inputStr.length - strlength); // chop off the oldest chars
        return tmpStr;
    } else {
        return inputStr;
    }
}

function buildTrend (inputStr, change) {
    var maxLength = 100; // 100 samples @15 min samples = 1500 mins ~24hrs
    if (change < 0) {
        inputStr += "d";
    } else if (change > 0) {
        inputStr += "u";
    } else { inputStr += "."; }

    return truncateString(inputStr, maxLength);
}

function doWeSell (inCalc, inLatest, inProfit, inChange, inMax) {
    var sell   = false;
    var ups    = (inCalc.trend.match(/u/g) || []).length;
    var downs  = (inCalc.trend.match(/d/g) || []).length;
    var flats  = (inCalc.trend.split(".").length -1);
    // console.log(inCalc.instrument + ' UPS: ' + ups + ' DOWNS: ' + downs + ' FLATS: ' + flats);

    if (inProfit >= inCalc.targetMargin && (inCalc.tradingEnabled)) {
        // 5% of highest maximum = myCalc.longTermMax * 0.95
        if (inLatest / inCalc.longTermMax >= 0.95 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " STRONG sell");
          sell = true;
        }
        // 2% of recent maximum = inMin * 0.98
        if (inLatest / inMax >= 0.98 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " short term maximum detected .. medium sell");
          sell = true;
        }
        // has the trend been mostly up and levelling off?
        if (ups / downs >= 0.98 && ups / downs <= 1.02 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " possible maxing out .. medium sell");
          sell = true;
        }
        if (flats / (flats + ups + downs) >= 0.4) {
          //40% no movements
          console.log(inCalc.instrument + " very flat medium sell");
          sell = true;
        }
    } else if (inProfit <= -(inCalc.targetMargin*1.25)) {
        // stop the loss!!
        sell = true;
        console.log('**STOP LOSS** ' + inCalc.instrument);
    }

    if (sell) {
        console.log('**SELL** recommended for ' + inCalc.instrument + ' @' + inLatest + ' for profit: ' + inProfit + '%');
    }

    return sell;
}

function doWeBuy (inCalc, inLatest, inChange, inMin) {
    var weight = 0;
    var buy    = false;
    var ups    = (inCalc.trend.match(/u/g) || []).length;
    var downs  = (inCalc.trend.match(/d/g) || []).length;
    var flats  = (inCalc.trend.split(".").length -1);
    // console.log(inCalc.instrument + ' UPS: ' + ups + ' DOWNS: ' + downs + ' FLATS: ' + flats);

    // 5% of lowest minimum = myCalc.longTermMin * 1.05
    if ( (inLatest/inCalc.longTermMin <= 1.05) && (inCalc.percentGain >= -0.5) && (inCalc.percentGain <= 0.5)) {
        console.log(inCalc.instrument + ' STRONG buy');
        weight += 25;
        buy = true;
    }
    // 2% of recent minimum = inMin * 1.02
    if ( (inLatest/inMin <= 1.02) && (inCalc.percentGain >= -0.5) && (inCalc.percentGain <= 0.5)) {
        console.log(inCalc.instrument + ' short term minimum detected .. medium buy');
        weight += 25;
        buy = true;
    }
    // has the trend been mostly down and bottoming out?
    if ((downs/ups >= 0.98) && (downs/ups <= 1.02) && (inCalc.percentGain >= -0.5) && (inCalc.percentGain <= 0.5)) {
        console.log(inCalc.instrument + ' possible bottoming out .. medium buy');
        weight += 25;
        buy = true;
    }
    if ( flats/(flats+ups+downs) >= 0.4 ) { //40% no movements
        console.log(inCalc.instrument + ' very flat medium buy');
        weight += 25;
        buy = true;
    }

    // if we don't have enough samples or if trading is disabled... no buying allowed
    if (inCalc.trend.length < 50 || !inCalc.tradingEnabled) { buy = false; }

    if (buy) {
        console.log('**BUY** recommended (score = ' + weight + ') for ' + inCalc.instrument + ' @' + inLatest);
    }
    return {buy, weight} ;
}

// ===============BUY functions=================================================================================================
function initiateBuy(client, crypto, price, weight, callback) {
    getBalance(client, "AUD", function(balance){
        console.log("my AUD balance is: "+balance);
        // calculate how many cryptos I can get from my allowance
        var weighting = weight/100; console.log("apply weighting: " + weighting);
        var volume = ((((balance/numberConverter)/6)/price)*weighting).toFixed(7);  //max 8 decimals, so number conversion makes it whole
        // create buy order .. call createOrder synchronously here
        createBuyOrder(client, crypto, price, volume, function(err, res){
            console.log('**BUY** => response**');
            if (err && !res.success) {
                console.log(err);
                console.log(res.errorMessage)
            }
            else {
                console.log(res);
            }
            callback(res);
        });
    });    
}

function getBalance(client, crypto, callback) {
    var bal = 0;
    client.getAccountBalances(function(err, data) {
        if (err){
            console.log(err.message);
        }
        else {
            data.forEach(function(account) {
                if (account.currency === crypto) {
                    bal = account.balance;
                }
            });
        }
        callback(bal);
    });
}

function createBuyOrder(client, crypto, price, volume, callback){
    volume = Math.round(volume * numberConverter); //can't have decimal volumes
    console.log("trying to buy "+volume+" "+crypto+" for "+price);
    client.createOrder(crypto, "AUD", price * numberConverter, volume, 'Bid', 'Market', "SSPL_09", function(err, data)
    {
        callback(err, data);
    });
}

//===============================================================================================================================

// ===============SELL functions=========+++=====================================================================================
function initiateSell(client, crypto, price, callback) {
    getBalance(client, crypto, function(balance){
        console.log("my "+ crypto + " balance is: "+balance);
        var volume = balance/numberConverter;
        // create sell order .. call createOrder synchronously here
        createSellOrder(client, crypto, price, volume, function(err, res){
            console.log('**SELL** => response**');
            if (err && !res.success) {
                console.log(err);
                console.log(res.errorMessage)
            }
            else {
                console.log(res);
            }
            callback(res);
        });
    });    
}

function getBalance(client, crypto, callback) {
    var bal = 0;
    client.getAccountBalances(function(err, data) {
        if (err){
            console.log(err.message);
        }
        else {
            data.forEach(function(account) {
                if (account.currency === crypto) {
                    bal = account.balance;
                }
            });
        }
        callback(bal);
    });
}

function createSellOrder(client, crypto, price, volume, callback){
    console.log("trying to sell "+volume+" "+crypto+" for "+price);
    client.createOrder(crypto, "AUD", price * numberConverter, volume * numberConverter, 'Ask', 'Market', "SSPL_09", function(err, data)
    {
        callback(err, data);
    });
}
//===============================================================================================================================


//=======main CALCULATION function==============================================================================================
helperObj.updateCalc = function (client, crypto, min, max, latest){
    // retrieve latest calcs for crypto
    Calc.findOneAndUpdate({'instrument': crypto}, {'instrument': crypto}, {upsert:true}, function(err, myCalc){
        if (err) {
            console.log(err.message);
        } else {
            // initialise some values
            if (!myCalc.previousPrice) { myCalc.previousPrice = latest; }
            if (!myCalc.trend) { myCalc.trend = ""; }
            if (!myCalc.percentGain) { myCalc.percentGain = "0"; }
            var change = ( (latest - myCalc.previousPrice) / myCalc.previousPrice )*100;

            // update average gain / loss
            var avg = (myCalc.percentGain + change) / 2;
            myCalc.percentGain = avg;

            console.log(crypto + ' recent min: ' + min + ' recent max: ' + max + ' latest: ' + latest + 
                        ' previous: ' + myCalc.previousPrice +' .. change: ' + change.toFixed(2) + '%  avg: ' + avg.toFixed(2) + '%');

            // update longTermMin and longTermMax if relevant
            if (!myCalc.longTermMin) { myCalc.longTermMin = min; }
            else if (min < myCalc.longTermMin){
                myCalc.longTermMin = min;
            }
            if (!myCalc.longTermMax) { myCalc.longTermMax = max; }
            else if (max > myCalc.longTermMax){
                myCalc.longTermMax = max;
            }

            // whats the trend?
            myCalc.trend = buildTrend(myCalc.trend, change);

            if (myCalc.lastAction === "buy"){
                var profit = ((latest - myCalc.lastTradedPrice) / myCalc.lastTradedPrice)*100;
                if (doWeSell(myCalc, latest, profit, change, max)) {
                    //update lastTradedPrice, update lastAction, average out running profit
                    initiateSell(client, crypto, latest, function(res){
                        if (res.success) {
                            console.log(crypto + " SELL order completed ok for " + profit.toFixed(2) +"% @" + latest);
                            myCalc.lastTradedPrice = latest; //or rather what the actual sale price is!
                            myCalc.lastAction = "sell";        
                            if (profit < 0) {
                                // we have just sold to stop loss, don't wait too long before considering to buy back in
                                myCalc.trend = truncateString(myCalc.trend, 45);
                            } else {
                                // we have just sold for profit, don't rush to buy back in
                                myCalc.trend = truncateString(myCalc.trend, 35);
                            }
                            if (myCalc.runningProfit === 0) {
                                myCalc.runningProfit = profit;
                            } else {
                                var avg = (myCalc.runningProfit + profit) / 2;
                                myCalc.runningProfit = avg;
                            }
                        } else {
                            console.log(crypto + " SELL order FAILED for " + profit.toFixed(2) +"% @" + latest);
                        }
                        myCalc.previousPrice = latest;
                        myCalc.save();
                    });
                } else {
                    myCalc.previousPrice = latest;
                    myCalc.save();
                }
            }
            else {
                let {buy, weight} = doWeBuy (myCalc, latest, change, min);
                if (buy) {
                    //update lastTradedPrice, update lastAction, average out running profit
                    initiateBuy(client, crypto, latest, weight, function(res){
                        if (res.success) {
                            console.log(crypto + ' BUY order completed ok: '+latest+' at '+weight+'% of investment allowance');
                            myCalc.lastTradedPrice = latest; //or rather what the actual sale price is!
                            myCalc.lastAction = "buy";
                        } else {
                            console.log(crypto + ' BUY order FAILED: '+latest+' at '+weight+'% of investment allowance');                            
                        }
                        myCalc.previousPrice = latest;
                        myCalc.save();
                    });
                } else {
                    myCalc.previousPrice = latest;
                    myCalc.save();
                }
            }
        }
    });
}

module.exports = helperObj;