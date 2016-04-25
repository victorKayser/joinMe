starter.controller('HomeCtrl', ['$scope', '$state', 'phoneFormatter', '$rootScope', 'auth', function($scope, $state, phoneFormatter, $rootScope, auth) {
  $scope.dataConnexionForm = {};

  // si la personne à un compte et est connectée
  // if (window.localStorage['user']) {
  //   if(JSON.parse(window.localStorage['user']) !== null) {
  //     //on va direct sur la map page
  //     $state.go('map');
  //   }
  // }

  $scope.createAccount = function() {
    $state.go('registration');
  }

  $scope.connect = function(){
    var phoneNumber = $scope.dataConnexionForm.phoneNumber;
    var password = $scope.dataConnexionForm.password;
    // si le numéro est set
    if (typeof(phoneNumber) !== 'undefined') {
      // si il est dans le bon format
      if (phoneFormatter.validate(phoneNumber)) {
        auth.login(phoneNumber, password, function(loginSuccess) {
          if (loginSuccess) {
              $state.go('map');
          }
          else {
              console.log('pas ok du tout');
          }
        });
      }
      else {
        $scope.dataConnexionForm.phoneNumber = '';
      }
    }
  }
}]);
