// helper object
var Calc   = require('../models/calcs');

var helperObj = {};

helperObj.updateCalc = function (crypto, min, max, latest){
    // retrieve latest calcs for crypto
    Calc.findOneAndUpdate({'instrument': crypto}, {'instrument': crypto}, {upsert:true}, function(err, myCalc){
        if (err) {
            console.log(err.message);
        } else {
            // update longTermMin and longTermMax if relevant
            console.log(crypto + ' recent min: ' + min + ' recent max: ' + max + ' latest: ' + latest);
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

module.exports = helperObj;