var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

//SCHEMA SETUP
var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    api_key: String,
    api_secret: String,
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);