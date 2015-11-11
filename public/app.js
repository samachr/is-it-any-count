var app = angular.module('rest-browser', ['ui.bootstrap', 'ngAnimate']);

app.controller('endpointsController', function($scope, $window, $http, $timeout, $modal) {
    $scope.items = ['item1', 'item2', 'item3'];

    $scope.showEndpointModal = function() {
      var addEndpointModalInstance = $modal.open({
        animation: false,
        templateUrl: 'addEndpointModal.html',
        controller: 'addEndpointModalInstanceCtrl',
        backdrop: "static",
        scope: $scope
      });
      addEndpointModalInstance.result.then(function (data) {
        $scope.update()
      });
    };

  var modalInstance = $modal.open({
    animation: false,
    templateUrl: 'myModalContent.html',
    controller: 'ModalInstanceCtrl',
    backdrop: "static"
  });

  $scope.update = function() {
    $scope.simpleEndpointsListing = [];
    $scope.endpoints = [];
    $http.get('/api/'+$scope.username+'?token=' + $scope.webAuthToken).
    success(function(data, status, headers, config) {
      $scope.progress += 50;
      data.forEach(function(endpoint) {
        var tablename = JSON.parse(endpoint.schema).tablename;
        var columns = JSON.parse(endpoint.schema).columns;
        $scope.endpoints['/api/'+$scope.username+"/"+tablename] = {
          url: '/api/'+$scope.username+"/"+tablename,
          columns: columns,
          data: []
        };
        $scope.simpleEndpointsListing.push('/api/'+$scope.username+"/"+tablename);
      })
      $scope.selectedEndpoint = $scope.endpoints[Object.keys($scope.endpoints)[0]].url;
      $scope.getListing($scope.selectedEndpoint);
    });
  };

  modalInstance.result.then(function (data) {
    var username = data.username;
    $scope.username = username;
    $scope.progress += 20;
      $scope.webAuthToken = data.token;
      $scope.update();
  });


  $scope.endpoints = [];
  $scope.responses = [];
  $scope.simpleEndpointsListing = [];
  $scope.webAuthToken = '';
  $scope.selectedEndpoint = "";
  $scope.new = {};

  $scope.getListing = function(endpoint) {
    $scope.new = {};
    $scope.progress = 0;
    $scope.currentPage = 0;
    $http.get(endpoint + '/all'+'?token=' + $scope.webAuthToken).
    success(function(data, status, headers, config) {
      $scope.endpoints[endpoint].data = [];
      data.forEach(function(data) {
        $scope.progress += 70 / data.length;
        $scope.endpoints[endpoint].data.push(data);
      })
    });
    $scope.progress = 100;
  }

  $scope.postListing = function() {
    $http.post($scope.selectedEndpoint+'?token=' + $scope.webAuthToken, $scope.new).
    success(function(data, status, headers, config) {
      $scope.getListing($scope.selectedEndpoint);
    });
  }

  $scope.putListing = function(row) {
    // console.log($scope.selectedEndpoint + "/" + row.id);
    $http.put($scope.selectedEndpoint + "/" + row.id+'?token=' + $scope.webAuthToken, row).
    success(function(data, status, headers, config) {
      $scope.getListing($scope.selectedEndpoint);
    });
  }

  $scope.itemsPerPage = 10;
  $scope.currentPage = 0;

  $scope.range = function() {
    var rangeSize = 5;
    var range = [];
    var start;

    start = $scope.currentPage;
    if (start > $scope.pageCount() - rangeSize) {
      start = $scope.pageCount() - rangeSize + 1;
    }

    for (var i = start; i < start + rangeSize; i++) {
      range.push(i);
    }
    return range;
  };

  $scope.prevPage = function() {
    if ($scope.currentPage > 0) {
      $scope.currentPage--;
    }
  };

  $scope.prevPageDisabled = function() {
    return $scope.currentPage === 0 ? "disabled" : "";
  };

  $scope.pageCount = function() {
    if ($scope.endpoints[$scope.selectedEndpoint]) {
      return Math.ceil($scope.endpoints[$scope.selectedEndpoint].data.length / $scope.itemsPerPage) - 1;
    } else {
      return 0;
    }
  };

  $scope.nextPage = function() {
    if ($scope.currentPage < $scope.pageCount()) {
      $scope.currentPage++;
    }
  };

  $scope.nextPageDisabled = function() {
    return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
  };
});

app.filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    if (input) return input.slice(start);
  };
});

app.directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        scope.$apply(function() {
          scope.$eval(attrs.ngEnter);
        });
        event.preventDefault();
      }
    });
  };
});

app.controller('ModalInstanceCtrl', function ($scope, $modalInstance, $http) {
  $scope.message = "Sign in";
  $scope.username = "";
  $scope.password = "";

  $scope.login = function () {
    // console.log($scope.username, $scope.password);
    $http.post('/api/auth', {
      username: $scope.username,
      password: $scope.password
    }).
    success(function(data, status, headers, config) {
      $modalInstance.close({token: data.token, username: $scope.username});
    }).
    error(function(data, status, headers, config) {
      $scope.message = "Invalid username or password";
    });
  };
});

app.controller('addEndpointModalInstanceCtrl', function ($scope, $modalInstance, $http) {
  $scope.schema = {tablename: null, columns: ['']};
  $scope.addColumn = function() {
    $scope.schema.columns.push('');
  };
  $scope.submit = function () {
    $http.post('/api/'+$scope.username+'?token=' + $scope.webAuthToken, {
      schema: JSON.stringify($scope.schema)
    }).
    success(function(data, status, headers, config) {
      $modalInstance.close({token: data.token, username: $scope.username});
    }).
    error(function(data, status, headers, config) {
      $scope.message = "Invalid username or password";
    });
  };
});
