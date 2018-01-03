var express  = require('express');
var router   = express.Router();

var Calc    = require('../models/calcs');

router.get("/", function(req, res){
    // res.send("Crypto Trader landing page");
    Calc.find({}, function(err, allCalcs){
        if (err) {
            console.log(err.message);
        } else {
            res.render("index", {calcs: allCalcs});
        }
    });
});



module.exports = router;