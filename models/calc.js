var mongoose   = require('mongoose');
var timestamps = require('mongoose-timestamp');

//SCHEMA SETUP
var calcSchema = new mongoose.Schema({
    longTermMin: Number,        // all time minimum value since records began
    longTermMax: Number,        // all time maximum value since records began
    shortTermMin: Number,        // recent minimum value since records began
    shortTermMax: Number,        // recent maximum value since records began
    trend: String,              // "d" (down) "u" (up) "." steady
    lastAction: String,         // "buy" or "sell"
    recommendedAction: String,  // "averagedown" to prompt a check if we should buy more
    previousPrice: Number,      // previous sample price
    lastTradedPrice: Number,    // last price achieve in a buy or sell action
    percentGain: Number,        // average percentage gain/loss over recorded data
    runningProfit: Number,      // accumulated profit over several trades
    instrument: String,         // crypto currency, eg "BTC", "ETH", "LTC", "BCH", "XRP"
    targetMargin: Number,       // target profit margin as a percentage
    tradingEnabled: Boolean,    // flag to enable/disable trades on this crypto 
    stoplossEnabled: Boolean,   // flag to enable/disable stop-loss trades on this crypto
    averagedownEnabled: Boolean,// flag to enable/disable Dollar Cost Average buying
    pumpAndDumpMarket: Boolean, // flag to signify a "pump'n dump" market is in effect, and buy back in only if we have come back down to earlier lows
    owner: {
        id: 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
});

calcSchema.plugin(timestamps);

module.exports = mongoose.model("Calc", calcSchema);