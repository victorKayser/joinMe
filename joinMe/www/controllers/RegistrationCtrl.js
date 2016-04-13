starter.controller('RegistrationCtrl', function($scope, $state, phoneFormatter, $ionicLoading, $http, $cordovaToast) {
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
          // password de minimum 6 caractères
          if ( (password1.length >= 6) && (password2.length >= 6) ) {
            // loader
            $ionicLoading.show({
              template: '<ion-spinner icon="android"/>'
            });
            // post les données au serveur
            $scope.registerUser(phoneNumber,password1, function (err) {
              $ionicLoading.hide();
              // registration ok, go to map view
              if (!err) {
                $state.go('map');
              }
              // number already used
              else {
                if (err.data.phoneNumber) {
                  $cordovaToast.showShortBottom('Phone number already used.');
                  console.log(err.data.phoneNumber);
                }
              }
            });
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
  // post les infos pour enregistrer les infos du nouvel utilisateur
  $scope.registerUser = function (phoneNumber,password, done) {

    $http.post(new Ionic.IO.Settings().get('serverUrl') + '/register',
    {
      phoneNumber : phoneNumber,
      password : password
    })
    .then(function successCallback() {
      done();
    }
    , function errorCallback(err) {
      done(err);
    });
  }

});
