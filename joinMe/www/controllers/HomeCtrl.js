starter.controller('HomeCtrl', ['$scope', '$state', 'phoneFormatter', function($scope, $state, phoneFormatter) {
  $scope.dataConnexionForm = {};

  $scope.createAccount = function() {
    $state.go('registration');
  }

  $scope.connect = function(){
    var phoneNumber = $scope.dataConnexionForm.phoneNumber;
    // si le numéro est set
    if (typeof(phoneNumber) !== 'undefined') {
      // si il est dans le bon format
      if (phoneFormatter.validate(phoneNumber)) {
        console.log('parfait');
        $state.go('map');
      }
      else {
        $scope.dataConnexionForm.phoneNumber = '';
      }
    }
  }
}]);
