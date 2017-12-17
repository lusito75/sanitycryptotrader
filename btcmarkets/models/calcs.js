var mongoose = require('mongoose');

//SCHEMA SETUP
var calcSchema = new mongoose.Schema({
    longTermMin: Number,
    longTermMax: Number,
    trend: String,
    lastAction: String,
    lastPrice: Number,
    instrument: String,
    timestamp: Number,
});

module.exports = mongoose.model("Calc", calcSchema);