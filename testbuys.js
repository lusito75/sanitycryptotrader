var secrets    = require('./secrets.json'),
    BTCMarkets = require('btc-markets');

var client = new BTCMarkets(secrets.api_key, secrets.api_secret);
var numberConverter = 100000000;    // one hundred million

function initiateBuy(client, crypto, price, weight, callback) {
    getBalance(client, "AUD", function(balance){
        console.log("my AUD balance is: "+balance);
        // calculate how many cryptos I can get from my allowance
        var weighting = weight/100; console.log("apply weighting: " + weighting);
        var volume = ((((balance/numberConverter)/6)/price)*weighting).toFixed(8);  //max 8 decimals, so number conversion makes it whole
        // create buy order .. call createOrder synchronously here
        createBuyOrder(client, crypto, price, volume, function(err, res){
            console.log('**BUY** => response**');
            if (err && !res.success) {
                // console.log(err.message);
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
    client.createOrder(crypto, "AUD", price * numberConverter, volume * numberConverter, 'Bid', 'Market', "SSPL_09", function(err, data)
    {
        callback(err, data);
    });
}



// run the order
initiateBuy(client, "XRP", 3.53, 25, function(res){
    if (res.success) {
        console.log('XRP BUY order completed ok');
    } else {
        console.log('XRP BUY order FAILED');                            
    }
});
