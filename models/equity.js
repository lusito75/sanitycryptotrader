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
    OMGbal: Number, OMGval: Number,
    POWRbal: Number, POWRval: Number,
    TOTval: Number,
    owner: {
        id: 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
});

equitySchema.plugin(timestamps);

module.exports = mongoose.model("Equity", equitySchema);