// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var starter = angular.module('starter', ['ionic', 'ngCordova', 'ngMap'])

.run(function($ionicPlatform, $state, $rootScope, $http) {
  $ionicPlatform.ready(function() {

    // si la personne à un compte et est connectée
    if (window.localStorage['user']) {
      if(JSON.parse(window.localStorage['user']) !== null) {

        $state.go('map');

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
      }
    }

    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
  .state('map', {
    url: '/map',
    templateUrl: 'templates/map.html',
    controller: 'MapCtrl'
  })
  $stateProvider
  .state('contact', {
    url: '/contact',
    templateUrl: 'templates/contact.html',
    controller: 'ContactCtrl'
  });
  $stateProvider
  .state('invitation', {
    url: '/invitation',
    templateUrl: 'templates/invitation.html',
    controller: 'InvitationCtrl'
  });
  $stateProvider
  .state('settings', {
    url: '/settings',
    templateUrl: 'templates/settings.html',
    controller: 'SettingsCtrl'
  });
  $stateProvider
  .state('home', {
    url: '/',
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl'
  });
  $stateProvider
  .state('registration', {
    url: '/registration',
    templateUrl: 'templates/registration.html',
    controller: 'RegistrationCtrl'
  });

  $urlRouterProvider.otherwise("/");

})

.filter('unique', function() {
   return function(collection, keyname) {
      var output = [],
          keys = [];

      angular.forEach(collection, function(item) {
          var key = item[keyname];
          if(keys.indexOf(key) === -1) {
              keys.push(key);
              output.push(item);
          }
      });

      return output;
   };
});
