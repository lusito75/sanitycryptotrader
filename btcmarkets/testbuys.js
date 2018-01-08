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
    console.log("trying to buy "+volume+" "+crypto+" for "+price);
    client.createOrder(crypto, "AUD", price * numberConverter, volume * numberConverter, 'Bid', 'Market', "SSPL_696969", function(err, data)
    {
        callback(err, data);
    });
}

getBalance(client, "AUD", function(balance){
    console.log("my AUD balance is: "+balance);
    // calculate how many cryptos I can get from my allowance
    var bidPrice = 3.77;
    var volume = ((balance/numberConverter)/6)/bidPrice;  //take care that volume cannot have decimal points!!
    // create buy order .. call createOrder synchronously here
    createBuyOrder(client, "XRP", bidPrice, volume, function(err, res){
        console.log('**BUY** => BTC response**');
        if (err && !res.success) {
            // console.log(err.message);
            console.log(res.errorMessage)
        }
        else {
            console.log(res);
            // update the calcs object and save to db
        }
    });
});
