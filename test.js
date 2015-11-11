console.log("Preparing tests");

var request = require("request");
var colors = require('colors');

var token = '';
var tests = [];
var currentTest = 0;

function runNextTest() {
  console.log("----------------------------".grey)
  var nextTest = tests.shift();
  if (nextTest) {
    process.stdout.write(nextTest.name + ": ");
    console.time("running time");
    nextTest.test();
  } else {
    console.log('All tests passed'.green);
  }
}

function fail(reason) {
  if(reason){
    process.stdout.write("Failed".red + " (" + reason + ")\n");
  } else {
    process.stdout.write("Failed".red + "\n");
  }
  console.log("aborting tests with", tests.length, "tests remaining".red);
}

function pass() {
  process.stdout.write("Passed".green + "\n");
  console.timeEnd("running time");
  runNextTest();
}


tests.push({name: "Security(no token)", test: function() {
  request({
    url: 'http://localhost:3000/api/admin',
    method: "GET"
  }, function(err, res, body) {
    if (JSON.parse(body).message == "no token") {
      pass();
    } else {
      fail();
    }
  });
}});

tests.push({name: "Login", test: function() {
  request({
    url: 'http://localhost:3000/api/auth',
    method: "POST",
    json: {
      username: 'testuser',
      password: 'testpass'
    }
  }, function(err, res, body) {
    if (body.success) {
      token = body.token;
      pass();
    } else {
      fail();
    }
  });
}});

tests.push({name: "Security(attempt access admin)", test: function() {
  request({
    url: 'http://localhost:3000/api/admin?token='+token,
    method: "GET"
  }, function(err, res, body) {
    if (JSON.parse(body).message == "unauthorized access") {
      pass();
    } else {
      fail();
    }
  });
}});

tests.push({name: "Add Schema", test: function() {
  request({
    url: 'http://localhost:3000/api/testuser?token='+token,
    method: "POST",
    json: {schema: JSON.stringify({
        tablename: 'testtable',
        columns: ['testcol1', 'testcol2']
      })
    }
  }, function(err, res, body) {
    if (res.statusCode==200) {
      pass();
    } else {
      fail();
    }
  });
}});

tests.push({name: "Clear Schemas", test: function() {
  request({
    url: 'http://localhost:3000/api/testuser?token='+token,
    method: "get",
  }, function(err, res, body) {
    var moreleft = 0;
    if(JSON.parse(body).length) {
      JSON.parse(body).forEach(function(schema){
        moreleft+=1;
        request({
          url: 'http://localhost:3000/api/testuser/'+schema.id+'?token='+token,
          method: "DELETE",
        }, function(err, res, body) {
          moreleft-=1;
          if(!moreleft) {
            pass();
          }
        });
      });
    } else {
      fail("empty result set");
    }
  });
}});

tests.push({name: "Add 50 Schema", test: function() {
  var moreleft = 0;
  for(var i = 0; i < 50; i++) {
    moreleft+=1;
    request({
      url: 'http://localhost:3000/api/testuser?token='+token,
      method: "POST",
      json: {schema: JSON.stringify({
          tablename: 'testtable' + i,
          columns: ['testcol1', 'testcol2']
        })
      }
    }, function(err, res, body) {
      moreleft-=1;
      if (res.statusCode==200) {
        if(!moreleft) pass();
      } else {
        fail();
      }
    });
  }
}});

tests.push({name: "Add data to Schemas", test: function() {
  var moreleft = 0;
  for(var i = 0; i < 50; i++) {
    moreleft+=1;
    request({
      url: 'http://localhost:3000/api/testuser/'+'testtable0'+'?token='+token,
      method: "POST",
      json: {
          testcol1: i,
          testcol2: i * 5
        }
    }, function(err, res, body) {
      moreleft-=1;
      if (res.statusCode==200) {
        if(!moreleft) pass();
      } else {
        fail();
      }
    });
  }
}});

tests.push({name: "Get all schema", test: function() {
    request({
      url: 'http://localhost:3000/api/testuser?token='+token,
      method: "GET"
    }, function(err, res, body) {
      if (JSON.parse(body).length == 50) {
        pass();
      } else {
        fail("wrong number of schema");
      }
    });
}});

tests.push({name: "Clear all Schema", test: function() {
  request({
    url: 'http://localhost:3000/api/testuser?token='+token,
    method: "get",
  }, function(err, res, body) {
    var moreleft = 0;
    if(JSON.parse(body).length) {
      JSON.parse(body).forEach(function(schema){
        moreleft+=1;
        request({
          url: 'http://localhost:3000/api/testuser/'+schema.id+'?token='+token,
          method: "DELETE",
        }, function(err, res, body) {
          moreleft-=1;
          if(!moreleft) {
            pass();
          }
        });
      });
    } else {
      fail("empty result set");
    }
  });
}});

console.log("Running test suite on localhost:3000");
runNextTest();
