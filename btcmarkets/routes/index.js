var express  = require('express');
var router   = express.Router();

router.get("/", function(req, res){
    res.send("Crypto Trader landing page");
    // res.render("landing");
});



module.exports = router;