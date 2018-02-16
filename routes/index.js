var express  = require('express');
var router   = express.Router();

var Calc    = require('../models/calcs');
var Equity  = require('../models/equities');

router.get("/", function(req, res){
    // res.send("Crypto Trader landing page");
    Calc.find({}, function(err, allCalcs){
        if (err) {
            console.log(err.message);
        } else {
            Equity.find().sort({'createdAt': -1}).limit(1).find( function (err, latestEquity) {
                if (err) {
                    console.log(err.message);
                } else {
                    res.render("index", {calcs: allCalcs, updated: allCalcs[0].updatedAt, latestVals: latestEquity[0]});
                }
            });
        }
    });
});


// EDIT calc route
router.get("/calcs/:id/edit", function(req, res){
    Calc.findById(req.params.id, function(err, foundCalc){
        res.render("calcs/edit", {calc: foundCalc});
    });
});

// UPDATE calc route
router.put("/calcs/:id", function(req, res){
    //find and update the correct calc
    Calc.findByIdAndUpdate(req.params.id, req.body.calc, function(err, updatedCalc){
        if (err) {
            console.log(err.message);
            res.redirect("/");
        } else {
            console.log("Robot updated!");
            res.redirect("/");
        }
    });
});



module.exports = router;