var express  = require('express');
var router   = express.Router();
var passport = require('passport');
var middleware  = require('../middleware/mdwindex');

var Calc    = require('../models/calc');
var Equity  = require('../models/equity');
var User    = require('../models/user');

router.get("/", function(req, res){
    // res.send("Crypto Trader landing page");
    Calc.find({}, function(err, allCalcs){
        if (err) {
            console.log(err.message);
        } else {
            Equity.find().sort({'createdAt': -1}).limit(500).find( function (err, latestEquities) {
                if (err) {
                    console.log(err.message);
                } else {
                    res.render("index", {calcs: allCalcs, updated: allCalcs[0].updatedAt, latestVals: latestEquities[0], equities: latestEquities});
                }
            });
        }
    });
});

// Authenticated route to view active portfolio
router.get("/portfolio", middleware.isLoggedIn, function(req, res){
    Calc.find({'owner.username': activeUsername}, function(err, allCalcs){
        if (err) {
            console.log(err.message);
        } else {
            Equity.find({'owner.username': activeUsername}).sort({'createdAt': -1}).limit(1000).find( function (err, latestEquities) {
                if (err) {
                    console.log(err.message);
                } else {
                    //format data for chartjs
                    var eqLabels = [];
                    let eqTOTData = [], eqAUDdata = [], eqBTCdata = [], eqETHdata = [], eqLTCdata = [], eqXRPdata = [], eqBCHdata = [], eqETCdata = [];
                    latestEquities.forEach(function(equity){
                        eqLabels.push(new Date(equity.createdAt).getTime());
                        eqTOTData.push(equity.TOTval.toFixed(2));
                        eqAUDdata.push(equity.AUD.toFixed(2));
                        eqBTCdata.push(equity.BTCval.toFixed(2));
                        eqETHdata.push(equity.ETHval.toFixed(2));
                        eqLTCdata.push(equity.LTCval.toFixed(2));
                        eqXRPdata.push(equity.XRPval.toFixed(2));
                        eqBCHdata.push(equity.BCHval.toFixed(2));
                        eqETCdata.push(equity.ETCval.toFixed(2));
                    });
                    eqLabels.reverse();
                    eqTOTData.reverse();
                    eqAUDdata.reverse();
                    eqBTCdata.reverse();
                    eqETHdata.reverse();
                    eqLTCdata.reverse();
                    eqXRPdata.reverse();
                    eqBCHdata.reverse();
                    eqETCdata.reverse();
                    
                    res.render("portfolio", {
                        calcs: allCalcs,
                        labels: eqLabels,
                        TOTdata: eqTOTData,
                        AUDdata: eqAUDdata,
                        BTCdata: eqBTCdata,
                        ETHdata: eqETHdata,
                        LTCdata: eqLTCdata,
                        XRPdata: eqXRPdata,
                        BCHdata: eqBCHdata,
                        ETCdata: eqETCdata,
                    });
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
            res.redirect("/portfolio");
        } else {
            console.log("Robot updated!");
            res.redirect("/portfolio");
        }
    });
});


// =================
// AUTH ROUTES
router.get("/register", function(req, res){
    res.render("register");
});
// handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username,
                            api_key: req.body.api_key,
                            api_secret: req.body.api_secret});
    User.register(newUser, req.body.password, function(err, user){
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        req.flash("success", "Welcome to Sanity Crypto Trader " + req.body.username + " !");
        passport.authenticate("local")(req, res, function(){
            var tmpEquityData = {
                AUD: 0,
                BTCbal: 0, BTCval: 0,
                ETHbal: 0, ETHval: 0,
                LTCbal: 0, LTCval: 0,
                BCHbal: 0, BCHval: 0,
                XRPbal: 0, XRPval: 0,
                ETCbal: 0, ETCval: 0,
                TOTval: 0,
                owner: {
                    username: req.body.username,
                },
            };
            // create new equity for new user
            Equity.create(tmpEquityData, function(err, newData){
                if (err) { console.log(err.message)}
            });

            activeUsername = req.body.username;
            btcclient = null; //force a new client to be setup

            res.redirect("/portfolio");
        });
    });
});

//show login form
router.get("/login", function(req,res){
    res.render("login");
});

//handle login logic
router.post("/login", function(req, res, next) {
    passport.authenticate("local", function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            req.flash("error", "Login failed - try again");
            return res.redirect("/login");
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            activeUsername = user.username;
            btcclient = null; //force a new client to be setup
            req.flash("success", "Welcome back " + user.username);
            return res.redirect("/portfolio");
        });
    }) (req, res, next);
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out, but beware - this will keep trading in your name. To deactivate trading, log back in and edit trading settings");
    res.redirect("/");
});

// show edit user form
router.get("/edituser", middleware.isLoggedIn, function(req, res){
    res.render("edituser");
});

// edit user
router.put("/edituser", middleware.isLoggedIn, function(req, res){
    User.findByIdAndUpdate(req.user.id, {api_key: req.body.api_key, api_secret: req.body.api_secret}, function(err, myUser){
        if (err) {
            req.flash("error", err.message);
            res.redirect("/portfolio");
        }
        //reset the BTC client
        mykey     = req.body.api_key;
        mysecret  = req.body.api_secret;
        btcclient = null;
        // only update password if both fields filled out on form
        if (req.body.oldPassword && req.body.newPassword) {
            myUser.changePassword(req.body.oldPassword, req.body.newPassword, function(err, myUser){
                if (err) {
                    req.flash("error", err.message);
                    res.redirect("/portfolio");
                } else {
                    req.flash("success", "User profile and password updated successfully for " + myUser.username);
                    res.redirect("/portfolio");
                }
            });
        } else {
            req.flash("success", "User profile updated successfully for " + myUser.username);
            res.redirect("/portfolio");
        }
    });
});



module.exports = router;