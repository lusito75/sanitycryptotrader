var mongoose   = require('mongoose');
var timestamps = require('mongoose-timestamp');

//SCHEMA SETUP
var calcSchema = new mongoose.Schema({
    longTermMin: Number,
    longTermMax: Number,
    trend: String,
    lastAction: String,
    recommendedAction: String,
    lastPrice: Number,
    percentGain: Number,
    runningProfit: Number,
    instrument: String,
});

calcSchema.plugin(timestamps);

module.exports = mongoose.model("Calc", calcSchema);