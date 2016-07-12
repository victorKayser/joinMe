starter.controller('HomeCtrl', function($scope, $state, phoneFormatter, $rootScope, auth, $http, $ionicPopup) {
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
            //join la room correspondant à mon id
            var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));
            socket.emit('joinMyIdRoom', JSON.parse(window.localStorage['user']).id_users);

            if(!new Ionic.IO.Settings().get('isPC')) {
              // INIT PUSH
              $rootScope.push = PushNotification.init({
                  android: {
                      senderID : new Ionic.IO.Settings().get('senderId')
                  },
                  ios: {
                      alert: "true",
                      badge: "true",
                      sound: "true"
                  }
              });
              $rootScope.push.on('registration', function(data) {
                var registrationId = data.registrationId;
                var user_id =  JSON.parse(window.localStorage['user']).id_users;
                var OS = ionic.Platform.platform();
                $state.go('map');
                // met en bdd pour l'user en question le token de push ainsi que son device (ios ou android)
                $http.post(new Ionic.IO.Settings().get('serverUrl') + '/setPushInfos',
                {
                  id : user_id,
                  token: registrationId,
                  os: OS,
                })
                .then(function successCallback(contactsChecked) {}
                , function errorCallback(err) {});
              });
            }
            else {
              $state.go('map');
            }
          }
          else {
            $ionicPopup.alert({
               title: 'Erreur!',
               template: 'Couple n° téléphone / mot de passe incorrect.',
            });
            console.log('pas ok du tout');
          }
        });
      }
      else {
        $scope.dataConnexionForm.phoneNumber = '';
        $scope.dataConnexionForm.password = '';
        $ionicPopup.alert({
           title: 'Erreur!',
           template: 'Mauvais format pour votre n° de téléphone.',
        });
      }
    }
    else {
      $ionicPopup.alert({
         title: 'Erreur!',
         template: 'Veuillez renseigner votre n° de téléphone.',
      });
      $scope.dataConnexionForm.password = '';
    }
  }
});
