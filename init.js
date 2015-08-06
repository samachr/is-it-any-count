var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var logger = require('morgan');
var path = require('path');
var config = require('./config');
var colors = require('colors');

// configure app
app.use(logger('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// create our router
var router = express.Router();

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(path.join(__dirname, 'databases')+"/users.db");

var userdatabases = [];

console.log("---Initializing databases---".grey);

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");

  //make sure we have an admin user
  db.all("SELECT * FROM users WHERE username=(?) AND password=(?)", config.adminuser, config.adminpassword, function(err, rows) {
    if (!err && rows.length == 0) {
      console.log("The admin user did not exist, this must be a fresh setup. Adding admin user".blue);

      db.serialize(function() {
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", config.adminuser, config.adminpassword);

        console.log("...and some test users".blue);

        for (var i = 0; i < 10; i++) {
          db.run("INSERT INTO users (username, password) VALUES (?, ?)", "user" + i, i * 5.5);
        }
        initializeUserApis(db);
      });
    } else {
      console.log("Admin available".green);
      initializeUserApis(db);
    }
  });
});

function initializeUserApis(userdb) {
  userdb.all("SELECT username FROM users", function(err,rows){
    console.log((rows.length + " users found ").blue);

    rows.forEach(function(user){
      console.log((user.username).grey, path.join(__dirname, "databases/users/" + user.username + ".db"));

      userdatabases[user.username] = new sqlite3.Database(path.join(__dirname, "databases/users/" + user.username + ".db"));
      userdatabases[user.username].serialize(function() {
        userdatabases[user.username].run("CREATE TABLE IF NOT EXISTS "+ user.username +" (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
        userdatabases[user.username].run("CREATE TABLE IF NOT EXISTS databaseschemas (id INTEGER PRIMARY KEY, schema TEXT)");

        var testdata = {};
        testdata.tablename = "example";
        testdata.columns = [];
        testdata.columns.push("column1");
        testdata.columns.push("column2");

        userdatabases[user.username].run("INSERT INTO databaseschemas (schema) VALUES (?)", JSON.stringify(testdata));


        //TODO customize this shema route so that on adding it you do the setup automatically, and deleting deletes the database
        var url = '/api/' + user.username;
        app.use(url, require('./routes/rest-api-template.js')(userdatabases[user.username], "databaseschemas", ["schema"]));

        userdatabases[user.username].all("SELECT schema FROM databaseschemas", function(err,rows){
          if(err) console.log(err.red);
          rows.forEach(function(table){
            var tableobject = JSON.parse(table.schema);

            app.use(url + "/" + tableobject.tablename, require('./routes/rest-api-template.js')(userdatabases[user.username], tableobject.tablename, tableobject.columns));
          });
        });
      });
      // userdatabases[user.username].close();
    });
  });
}

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

var server = app.listen(port, ipaddress, function() {
  console.log(('Server ready on ' + ipaddress + " port " + port).green);
});
