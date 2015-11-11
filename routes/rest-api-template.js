module.exports = function (db, table, columns) {
  var express = require('express');
  var router = express.Router();

  var questionMarks = columns.map(function(){return "?"}).join(", ");

  var SQLSchemaStatement = "CREATE TABLE IF NOT EXISTS " + table + " (id INTEGER PRIMARY KEY, " + columns.join(" TEXT, ") + " TEXT)";
  var SQLGetStatement = "SELECT * FROM " + table + "";
  var SQLPostStatement = "INSERT INTO " + table + " (" + columns.join() + ") VALUES (" + questionMarks + ")";
  var SQLGetByIDStatement = "SELECT id, " + columns.join() + " FROM " + table + " WHERE id=(?)";
  var SQLPutByIDStatement = "UPDATE " + table + " SET "+ columns.join("=(?), ") + "=(?) WHERE id=(?)";
  var SQLDeleteByIDStatement = "DELETE from " + table + " where id=(?)";

  db.run(SQLSchemaStatement);

  router.get('/', function(req, res, next) {
    db.all(SQLGetStatement, function(err, rows) {
      if (err) console.log(err);
      res.json(rows);
    });
  });

  router.get('/all', function(req, res, next) {
    db.all(SQLGetStatement, function(err, rows) {
      if (err) console.log(err);
      res.json(rows);
    });
  });

  router.get('/columns', function(req, res, next) {
    var tempColumns = [];
    tempColumns.push('id');
    columns.forEach(function(column){
      tempColumns.push(column);
    });
    res.json(tempColumns);
  });

  router.post('/', function(req, res, next) {
    db.run(SQLPostStatement, columns.map(function(column){return req.body[column]}), function(err) {
      if(err) {
        res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  });

  router.get('/:id', function(req, res, next) {
    db.all(SQLGetByIDStatement, req.params.id, function(err, rows) {
      if (err) console.log(err);
      res.json(rows);
    });
  });

  router.put('/:id', function(req, res, next) {
    var columnData = columns.map(function(column){return req.body[column]});
    columnData.push(req.params.id);

    db.run(SQLPutByIDStatement, columnData, function(err) {
      if (err) {
        console.log(err);
        res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  });

  router.delete('/:id', function(req, res, next) {
    db.run(SQLDeleteByIDStatement, req.params.id, function(err) {
      if (err) {
        console.log(err);
        res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  });

  return router;
}
