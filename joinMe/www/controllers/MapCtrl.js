starter.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation) {
  //arrivée sur l'appli
  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  socket.on('authentification', function() {
      console.log('socket server authentification : OK billy');
  });


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
