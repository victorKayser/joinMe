starter.controller('RegistrationCtrl', function($scope, $state, phoneFormatter) {
  $scope.dataRegistration = {};

  $scope.create = function() {

    var phoneNumber = $scope.dataRegistration.phoneNumber;
    var password1 = $scope.dataRegistration.password1;
    var password2 = $scope.dataRegistration.password2;

    // si le numéro est set
    if (typeof(phoneNumber) !== 'undefined') {
      // si il est dans le bon format
      if (phoneFormatter.validate(phoneNumber)) {
        // si le password est set
        if ((typeof(password1) !== 'undefined') && (typeof(password2) !== 'undefined')) {
          if ( (password1.length >= 6) && (password2.length >= 6) ) {
            $state.go('map');
          }
          else {
            $scope.dataRegistration.password1 = '';
            $scope.dataRegistration.password2 = '';
          }
        }
      }
      else {
        $scope.dataRegistration.phoneNumber = '';
      }
    }
  }

});
