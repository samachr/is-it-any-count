var express = require('express');
var jwt = require('jsonwebtoken');
var config = require('../config.js');
var router = express.Router();
var db = require('../database/db.js');

router.get('/', function(req, res) {
  res.json({
    message: 'Not a getable resource.'
  });
});

router.post('/', function(req, res) {
  // console.log(req.body);
  db.all("SELECT * FROM users WHERE username=(?) AND password=(?)", req.body.username, req.body.password, function(err, rows) {
      if (err || rows.length == 0) {
        console.log("Fail!");
        res.status(401);
        res.json({
          success: false,
          message: "Invalid Username and/or password"
        })
        console.log(err);
      } else {
        // console.log("Success?");

        var token = jwt.sign({
          username: req.body.username
        }, config.secret, {
          expiresInMinutes: 43200 //one month
        });
        res.json({
          success: true,
          token: token
        });
      }
    })
    //res.json({"Hello":req.body.username});
});

module.exports = router;
