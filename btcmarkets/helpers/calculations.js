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
            if (change < 0) {
                myCalc.trend += "d";
            } else if (change > 0) {
                myCalc.trend += "u";
            } else { myCalc.trend += "."; }
            myCalc.trend = truncateString(myCalc.trend, 672); // 672 samples = 1 week @ 15 min samples

            if (myCalc.lastAction === "buy"){
                var profit = ((latest - myCalc.lastTradedPrice) / myCalc.lastTradedPrice)*100;
                if (profit >= 10){
                    console.log(crypto + " SELL for " + profit +"% @" + latest);
                    //update lastTradedPrice, update lastAction, average out running profit
                    myCalc.lastTradedPrice = latest; //or rather what the actual sale price is!
                    myCalc.lastAction = "sell";
                    var avg = (myCalc.runningProfit + profit) / 2;
                    myCalc.runningProfit = avg;
                }
                // add a stop loss condition?
            }
            else {
                if (latest <= min){
                    // console.log(crypto + " lowest value in last week: @" + latest + " BUY moderate");
                    if (latest <= myCalc.longTermMin) {
                        // console.log(crypto + " lowest value on record: @" + latest + " BUY strong");
                    }
                    // console.log(crypto + " BUY for " + latest);
                    //update lastTradedPrice, update lastAction
                }
                if (latest < max){
                    // console.log(crypto + " latest price lower than last week peak: @" + latest + " BUY moderate");
                    if (latest < myCalc.longTermMax) {
                        // console.log(crypto + " latest price lower than recorded peak: @" + latest + " BUY strong");
                    }
                    // console.log(crypto + " BUY for " + latest);
                    //update lastTradedPrice, update lastAction
                }
            }
            // if latest < longTermMin
            // --> if myCalc.trend === "falling" --> still falling
            // --> else if myCalc.trend === "rising" --> reset to falling, sell at latest(?)
            // if latest > longTermMax
            // --> if myCalc.trend === "rising" --> still rising
            // --> else if myCalc.trend === "falling" --> reset to rising, buy at latest(?)
            //
            myCalc.previousPrice = latest;
            myCalc.save();
        }
    });
}

module.exports = helperObj;