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
router.get("/portfolio", function(req, res){
    res.render("portfolio");
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
    // activeUsername = "";
    // btcclient = null;
    req.flash("success", "Logged you out!");
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