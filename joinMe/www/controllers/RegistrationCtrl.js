starter.controller('RegistrationCtrl', function($scope, $state, phoneFormatter, $ionicLoading, $http, $cordovaToast, auth, $rootScope, $ionicSlideBoxDelegate) {
  $scope.dataRegistration = {};



  $scope.stopTab = function($event) {
    var evt = $event || window.event
    if (( evt.keyCode === 9 ) || ( evt.keyCode === 13 )) {
        evt.preventDefault();
        if(evt.srcElement.id === 'phone') {
          $scope.validatePhone();
        }
        else if (evt.srcElement.id === 'password') {
          $scope.validatePassword();
        }
        else {
          $scope.create();
        }
        window.cordova.plugins.Keyboard.close();
    }
  };

  $scope.disableSwipe = function() {
    $ionicSlideBoxDelegate.$getByHandle('registration').enableSlide(false);
  };

  $scope.validatePhone = function(){
    var phoneNumber = $scope.dataRegistration.phoneNumber;
    // si le numéro est set
    if (typeof(phoneNumber) !== 'undefined') {
      // si il est dans le bon format
      if (phoneFormatter.validate(phoneNumber)) {
        $ionicSlideBoxDelegate.$getByHandle('registration').slide(1);
      }
      else {
        $cordovaToast.showShortBottom('Format de n° de télephone non correct, ex : +33612365478, 0658987452');
        $scope.dataRegistration.phoneNumber = '';
      }
    }
    else {
      $cordovaToast.showShortBottom('Vous devez renseigner votre n° de téléphone');
    }
  };

  $scope.validatePassword = function() {
    var password1 = $scope.dataRegistration.password1;
    if (typeof(password1) !== 'undefined') {
      if ( password1.length >= 6 ) {
        $ionicSlideBoxDelegate.$getByHandle('registration').slide(2);
      }
      else {
        $cordovaToast.showShortBottom('Le mot de passe doit contenir au moins 6 caractères');
        $scope.dataRegistration.password1 = '';
      }
    }
    else {
      $cordovaToast.showShortBottom('Vous devez renseigner un mot de passe');
    }
  }

  $scope.create = function() {

    var phoneNumber = $scope.dataRegistration.phoneNumber;
    var password1 = $scope.dataRegistration.password1;
    var name = $scope.dataRegistration.name;

    if (typeof(name) !== 'undefined') {
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
            $ionicSlideBoxDelegate.$getByHandle('registration').slide(0);
            $cordovaToast.showShortBottom('N° de téléphone déjà utilisé');
          }
        }
      });
    }
    else {
      $ionicSlideBoxDelegate.$getByHandle('registration').slide(2);
      $cordovaToast.showShortBottom('Vous devez renseigner votre nom');
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
