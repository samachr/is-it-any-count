(function(angular, undefined) {
  "use strict";
  angular.module('demoApp', ['ngMaterial', "ngRoute", "ui.ace"])
    .config(["$routeProvider", function($routeProvider) {
      $routeProvider.when("/editor", {
        templateUrl: "partials/aceEditor.html",
        controller: "aceController"
      });
      $routeProvider.when("/view2", {
        templateUrl: "partials/view2.html"
      });
      $routeProvider.when("/status", {
        templateUrl: "partials/view3.html"
      });
      $routeProvider.otherwise({
        redirectTo: "/editor"
      });
    }]).config(function($mdThemingProvider) {
      $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('red');
    })
    .controller('DemoController', function($scope, $location, $log) {
      $scope.selectedIndex = 0;

      $scope.$watch('selectedIndex', function(current, old) {
        switch (current) {
          case 0:
            $location.url("/editor");
            break;
          case 1:
            $location.url("/view2");
            break;
          case 2:
            $location.url("/status");
            break;

        }
      });
    })
    .controller('aceController', function($scope, $timeout, $mdSidenav, $mdComponentRegistry, $log, persist) {
      $scope.toggle = angular.noop;
      $scope.isOpen = function() {
        return false
      };

      $mdComponentRegistry
        .when('right')
        .then(function(sideNav) {

          $scope.isOpen = angular.bind(sideNav, sideNav.isOpen);
          $scope.toggle = angular.bind(sideNav, sideNav.toggle);

        });

      $scope.toggleLeft = function() {
        $mdSidenav('left').toggle()
          .then(function() {
            $log.debug("toggle left is done");
          });
      };
      $scope.toggleRight = function() {
        $mdSidenav('right').toggle()
          .then(function() {
            $log.debug("toggle RIGHT is done");
          });
      };

      $scope.aceLoaded = function(_editor) {
        $scope.editor = _editor;
        ace.require("ace/ext/language_tools");
        $scope.editor.$blockScrolling = Infinity;
        // $scope.editor.setKeyboardHandler('sublime');
        $scope.editor.setValue(persist.contents);
        $scope.editor.selection.clearSelection();
        $scope.editor.getSession().setMode("ace/mode/ruby");
        $scope.editor.setOptions({
          enableBasicAutocompletion: true,
          enableSnippets: true,
          enableLiveAutocompletion: false
        });

        // Options
        // _editor.setReadOnly(true);

        // console.log($scope.editor);
      };

      $scope.aceChanged = function(e) {
        persist.contents = $scope.editor.getValue();
      };
    })
    .factory('persist', ['$window', function(win) {
      var persist = {};
      persist.contents = "puts 'hello world'";
      return persist;
    }]);


})(angular);
