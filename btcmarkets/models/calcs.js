var mongoose = require('mongoose');

//SCHEMA SETUP
var calcSchema = new mongoose.Schema({
    longTermMin: Number,
    longTermMax: Number,
    trend: String,
    lastAction: String,
    lastPrice: Number,
    instrument: String,
    lastUpdated: {type: Date, default: Date.now },
});

module.exports = mongoose.model("Calc", calcSchema);