// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var logger = require('morgan');
var path = require('path');
var jwt = require('jsonwebtoken');
var config = require('./config');

// configure app
app.use(logger('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

var db = require('./database/db.js');
var dbconfig = require('./database/config.js');

// ROUTES FOR OUR API
// =============================================================================
app.set('jwtkey', config.secret);

app.use('/api/auth', require('./routes/auth.js'));

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('jwtkey'), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });

  }
});

dbconfig.tables.forEach(function(table) {
  app.use('/api/' + table.name, require('./routes/rest-api-template.js')(table.name, table.columns));
});

//make sure we have an admin user
db.all("SELECT * FROM users WHERE username=(?) AND password=(?)", config.adminuser, config.adminpassword, function(err, rows) {
  if (!err && rows.length == 0) {
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", config.adminuser, config.adminpassword)
  }
});

router.get('/', function(req, res) {
  res.json({
    message: 'Welcome to the api!',
    endpoints: dbconfig.tables.map(function(table) {
      return '/api/' + table.name
    })
  });
});

app.use('/api', router);

app.use(express.static(path.join(__dirname, 'public')));

// START THE SERVER
// =============================================================================

var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

app.listen(port, ipaddress, function() {
  console.log('Magic happens on port ' + port);
});
