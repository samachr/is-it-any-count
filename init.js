var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');
var config = require('./config');
var colors = require('colors');
var jwt = require('jsonwebtoken');

// configure app
app.use(require('morgan')('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//setup database directories
var fs = require('fs');
try {
  fs.mkdirSync(path.join(__dirname, 'databases'));
  fs.mkdirSync(path.join(__dirname, 'databases/users'));
  console.log('Created Directory Structure'.grey)
} catch(e) {
  if(e.code == "EEXIST") {
    console.log("Directory Structure Valid".green);
  }
}

//web token based routing security
app.set('jwtkey', config.secret);
app.use(function (req, res, next) {
  if(req.url.indexOf('/api') == 0) {
    if(req.url.indexOf('/api/auth') == 0) {
      next();
    } else {
      var token = req.body.token || req.query.token || req.headers['x-access-token'];
      if (token) {
        jwt.verify(token, app.get('jwtkey'), function(err, decoded) {
          if (err) {
            res.json({
              message: 'something bad happened with the token'
            });
          } else {
            req.decoded = decoded;
            if (req.url.indexOf('/api/' + req.decoded.username) == 0) {
              next();
            } else {
              res.status('403');
              res.json({
                message: 'unauthorized access'
              });
            }
          }
        });
      } else {
        res.json({
          message: 'no token'
        });
      }
    }
  } else {
    //not on api, just pass it on
    next();
  }
});

// var sqlite3 = require('sqlite3').verbose();
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(path.join(__dirname, 'databases')+"/users.db");

var userdatabases = [];
var databasesExist = false;

app.post('/api/auth', function(req, res) {
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
      var token = jwt.sign({
        username: req.body.username
      }, config.secret, {
        expiresIn: 2592000 //one month
      });
      res.json({
        success: true,
        token: token
      });
    }
  });
});

console.log("---Initializing databases---".grey);

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");

  //make sure we have an admin user
  db.all("SELECT * FROM users WHERE username=(?) AND password=(?)", config.adminuser, config.adminpassword, function(err, rows) {
    if (!err && rows.length == 0) {
      console.log("The admin user did not exist, this must be a fresh setup. Adding admin user".yellow);

      db.serialize(function() {
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", config.adminuser, config.adminpassword);

        console.log("...and a test user".yellow);

        db.run("INSERT INTO users (username, password) VALUES (?, ?)", "testuser", "testpass");

        initializeUserApis(db);
      });
    } else {
      console.log("Admin available".green);
      databasesExist = true;
      initializeUserApis(db);
    }
  });
});

function initializeUserApis(userdb) {
  userdb.all("SELECT username FROM users", function(err,rows){
    console.log((rows.length + " users found ").yellow);

    rows.forEach(function(user){
      console.log((user.username).grey, path.join(__dirname, "databases/users/" + user.username + ".db"));

      userdatabases[user.username] = new sqlite3.Database(path.join(__dirname, "databases/users/" + user.username + ".db"));
      userdatabases[user.username].serialize(function() {
        userdatabases[user.username].run("CREATE TABLE IF NOT EXISTS "+ user.username +" (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
        userdatabases[user.username].run("CREATE TABLE IF NOT EXISTS databaseschemas (id INTEGER PRIMARY KEY, schema TEXT)");

        if(!databasesExist) {
          var testdata = {};
          testdata.tablename = "example";
          testdata.columns = [];
          testdata.columns.push("column1");
          testdata.columns.push("column2");
          userdatabases[user.username].run("INSERT INTO databaseschemas (schema) VALUES (?)", JSON.stringify(testdata));
        }

        var url = '/api/' + user.username;

        app.post(url, function(req, res, next) {
          var tableobject = JSON.parse(req.body.schema);
          app.use(url + "/" + tableobject.tablename, require('./routes/rest-api-template.js')(userdatabases[user.username], tableobject.tablename, tableobject.columns));
          next();
        });

        app.delete(url, function(req, res, next) {
          userdatabases[user.username].all(SQLGetByIDStatement, req.params.id, function(err, rows) {
            if (err) console.log(err);
            if(rows.length) userdatabases[user.username].run("DROP TABLE" + JSON.parse(rows[0].schema).tablename);
          });
          next();
        });

        app.use(url, require('./routes/rest-api-template.js')(userdatabases[user.username], "databaseschemas", ["schema"]));

        userdatabases[user.username].all("SELECT schema FROM databaseschemas", function(err,rows){
          if(err) console.log(err.red);
          rows.forEach(function(table){
            var tableobject = JSON.parse(table.schema);
            app.use(url + "/" + tableobject.tablename, require('./routes/rest-api-template.js')(userdatabases[user.username], tableobject.tablename, tableobject.columns));
          });
        });
      });
    });
  });
}

app.use(express.static(path.join(__dirname, 'public')));

// START THE SERVER
// =============================================================================

var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var server = app.listen(port, ipaddress, function() {
  console.log(('Server ready on ' + ipaddress + " port " + port).green);
});
