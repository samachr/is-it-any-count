//test database for development

var sqlite3 = require('sqlite3').verbose();

if (process.env.OPENSHIFT_DATA_DIR) {
  var db = new sqlite3.Database(process.env.OPENSHIFT_DATA_DIR + "rest.db");
} else {
  var db = new sqlite3.Database(':memory:');

  db.run("CREATE TABLE IF NOT EXISTS bears (id INTEGER PRIMARY KEY, name TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY, tablename TEXT, columnjson TEXT)");

  db.serialize(function() {
    db.run("INSERT INTO bears (name) VALUES (?)", "Kevin Murphy");
    db.run("INSERT INTO bears (name) VALUES (?)", "Care Bear");
    db.run("INSERT INTO bears (name) VALUES (?)", "Bare Dare");
    db.run("INSERT INTO bears (name) VALUES (?)", "Stare Dare Bear Care, Jr.");


    var testdata = {};
    testdata.columns = [];
    testdata.columns.push("column1");
    testdata.columns.push("column2");
    console.log(testdata);

    // db.run("INSERT INTO users (username, password) VALUES (?,?)", "kyle", "d7b47bfa1e25cd2de6142522d486b2fb4c818598c090ccd4ef5c6ba415aa7846ca4da04decbdbf04");
    db.run("INSERT INTO users (username, password) VALUES (?,?)", "admin", "admin");
    db.run("INSERT INTO admin (tablename, columnjson) VALUES (?,?)", "test", JSON.stringify(testdata));

    // for (var i = 0; i < 1000; i++) {
    //   db.run("INSERT INTO users (username, password) VALUES (?, ?)", "Bear User " + i, i * 5.5);
    // }
  });
}

var dbconfig = require('./config.js');

module.exports = db;
