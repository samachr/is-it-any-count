var app = angular.module('rest-browser', ['ui.bootstrap', 'ngAnimate']);

app.controller('endpointsController', function($scope, $window, $http, $timeout, $modal) {
    $scope.items = ['item1', 'item2', 'item3'];

  var modalInstance = $modal.open({
    animation: false,
    templateUrl: 'myModalContent.html',
    controller: 'ModalInstanceCtrl',
    backdrop: "static"
  });

  modalInstance.result.then(function (token) {
    // console.log(token);
    $scope.progress += 20;
      $scope.webAuthToken = token;
      $http.get('/api?token=' + $scope.webAuthToken).
      success(function(data, status, headers, config) {
        $scope.progress += 50;
        data.endpoints.forEach(function(endpoint) {
          $scope.endpoints[endpoint] = {
            url: endpoint,
            data: []
          };
          $scope.simpleEndpointsLising.push(endpoint);
        })
        $scope.selectedEndpoint = $scope.endpoints[data.endpoints[0]].url;
        $scope.getListing($scope.selectedEndpoint);
      });
  });


  $scope.endpoints = [];
  $scope.responses = [];
  $scope.simpleEndpointsLising = [];
  $scope.webAuthToken = '';
  $scope.selectedEndpoint = "";
  $scope.new = {};

  $scope.getListing = function(endpoint) {
    $scope.new = {};
    $scope.progress = 0;
    $scope.currentPage = 0;
    // $http.get(endpoint + '/columns').
    // success(function(data, status, headers, config) {
    //   $scope.progress += 20;
    //   $scope.endpoints[endpoint].columns = [];
    //   data.forEach(function(data) {
    //     $scope.new[data] = "";
    //     $scope.endpoints[endpoint].columns.push(data);
    //   })
    // });
    $http.get(endpoint).
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
    // console.log($scope.new);
    $http.post($scope.selectedEndpoint, $scope.new).
    success(function(data, status, headers, config) {
      $scope.getListing($scope.selectedEndpoint);
    });
  }

  $scope.putListing = function(row) {
    // console.log($scope.selectedEndpoint + "/" + row.id);
    $http.put($scope.selectedEndpoint + "/" + row.id, row).
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
      $modalInstance.close(data.token);
    }).
    error(function(data, status, headers, config) {
      $scope.message = "Invalid username or password";
    });
  };
});
