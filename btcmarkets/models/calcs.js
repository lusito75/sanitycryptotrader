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
    percentGain: Number,        // average percentage gain/loss over recorded data
    runningProfit: Number,      // accumulated profit over several trades
    instrument: String,         // crypto currency, eg "BTC", "ETH", "LTC", "BCH", "XRP"
    targetMargin: Number,       // target profit margin as a percentage
    tradingEnabled: Boolean,    // flag to enable/disable trades on this crypto 
    stoplossEnabled: Boolean,   // flag to enable/disable stop-loss trades on this crypto 
});

calcSchema.plugin(timestamps);

module.exports = mongoose.model("Calc", calcSchema);