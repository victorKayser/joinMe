starter.controller('RegistrationCtrl', function($scope, $state, phoneFormatter, $ionicLoading, $http, $cordovaToast, auth) {
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
            // same password
            if (password1 === password2) {
              // loader
              $ionicLoading.show({
                template: '<ion-spinner icon="android"/>'
              });
              // post les données au serveur
              $scope.registerUser(phoneNumber,password1, function (err) {
                $ionicLoading.hide();
                // registration ok, go to map view
                if (!err) {
                  auth.login(phoneNumber, password1, function(loginSuccess) {
                    if (loginSuccess) {
                        $state.go('map');
                    }
                    else {
                        console.log('pas ok du tout');
                    }
                  });
                }
                // number already used
                else {
                  if (err.data.phoneNumber) {
                    console.log(err.data.phoneNumber);
                    $cordovaToast.showShortBottom('Phone number already used.');
                  }
                }
              });
            }
            else {
              $cordovaToast.showShortBottom('Password are not identical.');
              $scope.dataRegistration.password1 = '';
              $scope.dataRegistration.password2 = '';
            }
          }
          else {
            $cordovaToast.showShortBottom('The password has to have 6 caracters.');
            $scope.dataRegistration.password1 = '';
            $scope.dataRegistration.password2 = '';
          }
        }
        else {
          $cordovaToast.showShortBottom('You have to set a password.');
        }
      }
      else {
        $cordovaToast.showShortBottom('Phone number not in a good format, ex : +33612365478, 0658987452');
        $scope.dataRegistration.phoneNumber = '';
      }
    }
    else {
      $cordovaToast.showShortBottom('You have to set a phone number');
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

  // obtient les infos du nouvel utilisateur crée
  $scope.getNewUserInfos = function (phoneNumber,password, done) {
    $http.post(new Ionic.IO.Settings().get('serverUrl') + '/getUser',
    {
      phoneNumber : phoneNumber,
      password : password
    })
    .then(function successCallback(res) {
      done(null, res.data);
    }
    , function errorCallback(err) {
      done(err);
    });
  }

});
