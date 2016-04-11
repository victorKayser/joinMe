starter.controller('HomeCtrl', function($scope, $state) {
  $scope.createAccount = function() {
    $state.go('registration');
  }
});
