var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets');

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);
var numberConverter = 100000000;    // one hundred million

function getBalance(client, crypto, callback) {
    var bal = 0;
    client.getAccountBalances(function(err, data) {
        if (err){
            console.log(err.message);
            reject(err.message);
        }
        else {
            data.forEach(function(account)
            {
                if (account.currency === crypto) {
                    bal = account.balance;
                }
            });
        }
        callback(bal);
    });
}

function createBuyOrder(client, crypto, price, volume, callback){
    client.createOrder(crypto, "AUD", price * numberConverter, volume * numberConverter, 'Bid', 'Market', "696969", function(err, data)
    {
        console.log(err, data);
        callback(err, data);
    });
}

getBalance(client, "AUD", function(balance){
    console.log("my AUD balance is: "+balance);
    // calculate how many cryptos I can get from my allowance
    var bidPrice = 3.75;
    var volume = ((balance/numberConverter)/6)/bidPrice;
    // create buy order .. call createOrder synchronously here
    createBuyOrder(client, "XRP", bidPrice, volume, function(err, res){
        console.log('**BUY** => BTC response**');
        console.log(err, res);
    });
});
