// helper object
var Calc   = require('../models/calcs');

var helperObj = {};

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
    var weight = 0;
    var sell   = false;
    var ups    = (inCalc.trend.match(/u/g) || []).length;
    var downs  = (inCalc.trend.match(/d/g) || []).length;
    var flats  = (inCalc.trend.split(".").length -1);
    // console.log(inCalc.instrument + ' UPS: ' + ups + ' DOWNS: ' + downs + ' FLATS: ' + flats);

    if (inProfit >= inCalc.targetMargin && (inCalc.tradingEnabled)) {
        // 5% of highest maximum = myCalc.longTermMax * 0.95
        if (inLatest / inCalc.longTermMax >= 0.95 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " STRONG sell");
          weight += 25;
          sell = true;
        }
        // 2% of recent maximum = inMin * 0.98
        if (inLatest / inMax >= 0.98 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " short term maximum detected .. medium sell");
          weight += 25;
          sell = true;
        }
        // has the trend been mostly up and levelling off?
        if (ups / downs >= 0.98 && ups / downs <= 1.02 && inCalc.percentGain <= 0.5) {
          console.log(inCalc.instrument + " possible maxing out .. medium sell");
          weight += 25;
          sell = true;
        }
        if (flats / (flats + ups + downs) >= 0.4) {
          //40% no movements
          console.log(inCalc.instrument + " very flat medium sell");
          weight += 25;
          sell = true;
        }
    } else if (inProfit <= -(inCalc.targetMargin)) {
        // stop the loss!!
        weight = 100; sell = true;
        console.log('**STOP LOSS** ' + inCalc.instrument);
    }

    if (sell) {
        console.log('**SELL** recommended (score = ' + weight + ') for ' + inCalc.instrument + ' @' + inLatest + ' for profit: ' + inProfit + '%');
    }

    return {sell, weight} ;
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

helperObj.updateCalc = function (crypto, min, max, latest){
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
                        ' previous: ' + myCalc.previousPrice +' .. change % : ' + change + ' avg %: ' + avg);

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
                // whats the sell weighting?
                let {sell, weight} = doWeSell(myCalc, latest, profit, change, max);
                if (sell) {
                    console.log(crypto + " SELL order for " + profit +"% @" + latest+' with weighting '+weight+'% of investment allowance');
                    //update lastTradedPrice, update lastAction, average out running profit
                    myCalc.lastTradedPrice = latest; //or rather what the actual sale price is!
                    myCalc.lastAction = "sell";
                    myCalc.trend = truncateString(myCalc.trend, 40); //reduce trend data so more samples can build up before another buy
                    var avg = (myCalc.runningProfit + profit) / 2;
                    myCalc.runningProfit = avg;
                }
            }
            else {
                let {buy, weight} = doWeBuy (myCalc, latest, change, min);
                if (buy) {
                    console.log(crypto + ' BUY order: '+latest+' at '+weight+'% of investment allowance');
                    //update lastTradedPrice, update lastAction, average out running profit
                    myCalc.lastTradedPrice = latest; //or rather what the actual sale price is!
                    myCalc.lastAction = "buy";
                }
            }

            myCalc.previousPrice = latest;
            myCalc.save();
        }
    });
}

module.exports = helperObj;