var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets');

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);
var numberConverter = 100000000;    // one hundred million


function initiateSell(client, crypto, price, callback) {
    getBalance(client, crypto, function(balance){
        console.log("my "+ crypto + " balance is: "+balance/numberConverter);
        // create sell order .. call createOrder synchronously here
        createSellOrder(client, crypto, price, balance, function(err, res){
            console.log('**SELL** => response**');
            if (err && !res.success) {
                console.log(err.message);
                console.log(res.errorMessage)
            }
            else {
                console.log(res);
                // update the calcs object and save to db
            }
            callback(res);
        });
    });    
}

function getBalance(client, crypto, callback) {
    var bal = 0;
    client.getAccountBalances(function(err, data) {
        if (err){
            console.log(err.message);
        }
        else {
            data.forEach(function(account) {
                if (account.currency === crypto) {
                    bal = account.balance;
                }
            });
        }
        callback(bal);
    });
}

function createSellOrder(client, crypto, price, volume, callback){
    console.log("trying to sell "+volume/numberConverter+" "+crypto+" for "+price);
    client.createOrder(crypto, "AUD", price * numberConverter, volume, 'Ask', 'Market', "SSPL_09", function(err, data)
    {
        callback(err, data);
    });
}


// run the order
initiateSell(client, "XRP", 3.67, function(res){
    if (res.success) {
        console.log('XRP SELL order completed ok');
    } else {
        console.log('XRP SELL order FAILED');                            
    }
});