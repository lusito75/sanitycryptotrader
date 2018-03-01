var express  = require('express');
var router   = express.Router();
var passport = require('passport');

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

// Authenticared route to view active portfolio
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
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/portfolio",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});

// show change password form
// router.get("/changepwd", middleware.isLoggedIn, function(req, res){
//     res.render("changepwd");
// });

// handle password change
// router.post("/changepwd", middleware.isLoggedIn, function(req, res){
//     console.log(req.user);
//     User.findById(req.user.id, function(err, myUser){
//         if (err) {
//             req.flash("error", err.message);
//             res.redirect("/wavetypes");
//         }
//         myUser.changePassword(req.body.oldPassword, req.body.newPassword, function(err, myUser){
//             if (err) {
//                 req.flash("error", err.message);
//                 res.redirect("/wavetypes");
//             } else {
//                 req.flash("success", "Password changed successfully for " + myUser.username);
//                 res.redirect("/wavetypes");
//             }
//         });
//     });
// });



module.exports = router;