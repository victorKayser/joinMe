starter.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $stateParams, $http, $rootScope) {
  //arrivée sur l'appli
  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  socket.on('authentification', function() {
      console.log('socket server authentification : OK billy');
  });

  $scope.bounds = new google.maps.LatLngBounds();

  if(!new Ionic.IO.Settings().get('isPC')) {
    // quand notif pour novuel invit, on ajoute la marker du sender sur la map
    $rootScope.push.on('notification', function(data) {
        $http.post(new Ionic.IO.Settings().get('serverUrl') + '/getInvitationInfos',
        {
          id : data.additionalData.invitationId,
        })
        .then(function successCallback(invitation) {
          var sender_position = invitation.data[0].sender_position;

          var senderLat = parseFloat(sender_position.split(', ')[0]);
          var senderLng = parseFloat(sender_position.split(', ')[1]);

          NgMap.getMap().then(function(map) {
            // crée le marker du sender
            $scope.markerSender = new google.maps.Marker({
               position: {lat: senderLat, lng: senderLng},
               map: map,
               title: 'test',
               draggable: false,
               icon: {
                 url : 'img/marker-user.png',
                 scaledSize: new google.maps.Size(20, 20)
               }
            });
            // ajoute a l'objet bounds le marker pour pouvoir zoomer automatiquement en fonction des markers
            $scope.bounds.extend($scope.markerSender.position);
          });
        }
        , function errorCallback(err) {
          console.log(err);
        });
    });
  }

  NgMap.getMap().then(function(map) {
    $scope.map = map;

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
          draggable: false,
          icon: {
            url : 'img/marker-user.png',
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        $scope.bounds.extend($scope.markerLocalisation.position);
        // si il y a le marker du sender, c'est qu'on vient depuis la notif
        if (typeof($scope.markerSender) !== 'undefined') {
          // donc on fitBounds càd zoom propre en fonction de tous les markers
          map.fitBounds($scope.bounds);
        }

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
          //  $scope.map.setCenter(
          //     new google.maps.LatLng(lat, lng)
          //  );

           // set on LS the new position
           window.localStorage['lastPosition'] = JSON.stringify(positionLS);

           // modify the position of the marker
           var newlatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
           $scope.markerLocalisation.setPosition(newlatlng);
         }
     );
  });
})
