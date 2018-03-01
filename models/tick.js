var mongoose = require('mongoose');

//SCHEMA SETUP
var tickSchema = new mongoose.Schema({
    bestBid: Number,
    bestAsk: Number,
    lastPrice: Number,
    currency: String,
    instrument: String,
    timestamp: Number,
    volume24h: Number,
});

module.exports = mongoose.model("Tick", tickSchema);