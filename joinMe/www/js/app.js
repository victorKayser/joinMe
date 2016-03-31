// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova', 'ngMap'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
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
    url: '/',
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

  $urlRouterProvider.otherwise("/");

})

.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation) {
  NgMap.getMap().then(function(map) {

    // check in LS if old position are saved
    if (window.localStorage['lastPosition']) {
      var lastPosition = JSON.parse(window.localStorage['lastPosition'] || '{}');
      //init the center on the old pos
      $scope.map.setCenter(
         new google.maps.LatLng(lastPosition.split(', ')[0], lastPosition.split(', ')[1])
      );
    }
    else {
      $scope.map.setZoom(11);
      // init in Paris
      $scope.map.setCenter(
         new google.maps.LatLng('48.8575954','2.3609439')
      );
    }
    // get the current position one time
    $cordovaGeolocation.getCurrentPosition().then(function(position){
       var lat = position.coords.latitude;
       var lng = position.coords.longitude;

       // init the center on the position
       $scope.map.setCenter(
          new google.maps.LatLng(lat, lng)
       );
       // zoom
       $scope.map.setZoom(15);

       // init the marker
       $scope.markerLocalisation = new google.maps.Marker({
          position: {lat: lat, lng: lng},
          map: map,
          title: 'test',
          draggable: true,
          icon: {
            url : 'img/marker-user.png',
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        $scope.markerLocalisation.addListener('click', function() {
          $state.go('invitation');
        });
    });

    // start the watcher
     var watch = $cordovaGeolocation.watchPosition({
         frequency: 1000,
         timeout: 3000,
         enableHighAccuracy: false
     }).then(function () {
         }, function (err) {

         }, function (position) {
           // for each new position
           var lat = position.coords.latitude;
           var lng = position.coords.longitude;
           var positionLS = lat + ', ' + lng;
           // center the map
           $scope.map.setCenter(
              new google.maps.LatLng(lat, lng)
           );

           // set on LS the new position
           window.localStorage['lastPosition'] = JSON.stringify(positionLS);

           // modify the position of the marker
           var newlatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
           $scope.markerLocalisation.setPosition(newlatlng);
         }
     );
  });
})

.controller('ContactCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.contacts = allContacts;
      console.log(allContacts);
    });
  };

  $scope.getAllContacts();

})

.controller('InvitationCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.contacts = allContacts;
      console.log(allContacts);
      var numberEmoji = 25;
      $scope.objEmojiRaw1 = [];
      $scope.objEmojiRaw2 = [];

      for(i=1; i<=numberEmoji; i=i+2) {
        $scope.objEmojiRaw1.push(i+'.png');
      }
      for(i=2; i<=numberEmoji; i=i+2) {
        $scope.objEmojiRaw2.push(i+'.png');
      }
    	$ionicLoading.hide();
    });
  };

  $ionicLoading.show({
    template: '<ion-spinner icon="android"/>'
  });

  $scope.getAllContacts();


});
