var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

//SCHEMA SETUP
var equitySchema = new mongoose.Schema({
    AUD: Number,
    BTCbal: Number, BTCval: Number,
    ETHbal: Number, ETHval: Number,
    LTCbal: Number, LTCval: Number,
    BCHbal: Number, BCHval: Number,
    XRPbal: Number, XRPval: Number,
    ETCbal: Number, ETCval: Number,
    TOTval: Number,
});

equitySchema.plugin(timestamps);

module.exports = mongoose.model("Equity", equitySchema);