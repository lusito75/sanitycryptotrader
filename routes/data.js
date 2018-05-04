var express  = require('express');
var router   = express.Router();

var Equity  = require('../models/equity');
var Tick    = require('../models/tick');


function getTickData() {
    var queryTicks = Tick.find({}).sort({'timestamp': -1}).limit(12);

    queryTicks.exec(function (err, latestTicks) {

        var response = latestTicks;
    });
}

router.get("/gettickdata", function (req, res) {
    getTickData(res);
    console.log(res);
});



module.exports = router;

