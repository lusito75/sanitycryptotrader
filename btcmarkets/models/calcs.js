var mongoose   = require('mongoose');
var timestamps = require('mongoose-timestamp');

//SCHEMA SETUP
var calcSchema = new mongoose.Schema({
    longTermMin: Number,        // all time minimum value since records began
    longTermMax: Number,        // all time maximum value since records began
    trend: String,              // "d" (down) "u" (up) "." steady
    lastAction: String,         // "buy" or "sell"
    recommendedAction: String,  // "buy" or "sell"
    previousPrice: Number,      // previous sample price
    lastTradedPrice: Number,    // last price achieve in a buy or sell action
    percentGain: Number,        // gain/loss since last trade
    runningProfit: Number,      // accumulated profit over several trades
    instrument: String,         // crypto currency, eg "BTC", "ETH", "LTC", "BCH", "XRP"
});

calcSchema.plugin(timestamps);

module.exports = mongoose.model("Calc", calcSchema);