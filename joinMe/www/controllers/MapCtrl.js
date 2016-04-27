starter.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $stateParams, $http, $rootScope, $cordovaToast) {
  //arrivée sur l'appli
  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  socket.on('authentification', function() {
      console.log('socket server authentification : OK billy');
  });

  socket.on('getGuessPosition', function(position) {
    NgMap.getMap().then(function(map) {
      if (!$scope.guessMarker) {
        $scope.guessMarker = new google.maps.Marker({
           position: position,
           map: map,
           title: 'test',
           draggable: false,
           icon: {
             url : 'img/marker-user.png',
             scaledSize: new google.maps.Size(20, 20)
           }
         });
         $scope.bounds.extend($scope.guessMarker.position);
         map.fitBounds($scope.bounds);
      }
      else {
        $scope.guessMarker.setPosition(position);
      }
    });
  });

  socket.on('newGuessIsComming', function() {
      $cordovaToast.showShortBottom('New guess is comming!');
  });

  $scope.bounds = new google.maps.LatLngBounds();

  if(!new Ionic.IO.Settings().get('isPC')) {
    // quand notif pour novuel invit, on ajoute la marker du sender sur la map
    $rootScope.push.on('notification', function(data) {

        $scope.invitationId = data.additionalData.invitationId;

        $http.post(new Ionic.IO.Settings().get('serverUrl') + '/getInvitationInfos',
        {
          id : data.additionalData.invitationId,
        })
        .then(function successCallback(invitation) {
          var sender_position = invitation.data[0].sender_position;

          var senderLat = parseFloat(sender_position.split(', ')[0]);
          var senderLng = parseFloat(sender_position.split(', ')[1]);

          $scope.emojiPath = invitation.data[0].emoji_path;

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

    // Init des variables pour les directions et le temps de voyage
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();
    var service = new google.maps.DistanceMatrixService();
    directionsDisplay.setMap(map);


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

        $scope.markerLocalisation.addListener('click', function() {
          $state.go('invitation');
        });
        $scope.bounds.extend($scope.markerLocalisation.position);

        // si il y a le marker du sender, c'est qu'on vient depuis la notif
        if (typeof($scope.markerSender) !== 'undefined') {
          // donc on fitBounds càd zoom propre en fonction de tous les markers
          map.fitBounds($scope.bounds);
          //affiche la div du bottom pour le choix des moyens de transports
          $scope.showDirection = true;

          // trace itinéraire piéton par défaut + temps de voyage
          $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.WALKING, "walk");
          angular.element(document.querySelectorAll('.walk')).addClass('selected');
        }

        // au click sur différent moyens de transport
        $scope.changeTransportKind = function(kind) {
          angular.element(document.querySelectorAll('.transport')).removeClass('selected');
          angular.element(document.querySelectorAll('.'+kind)).addClass('selected');

          // on recalcul la direction et le temps de voyage en fonction du type
          if (kind === "walk") {
            $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.WALKING, "walk");
          }
          else if (kind === "bicycle") {
            $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.BICYCLING, "bicycle");
          }
          else {
            $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.DRIVING, "car");
          }
        }

        $scope.responseInvitation = function(state) {
          // recentre sur la personne
          $scope.map.setCenter(
             new google.maps.LatLng(lat, lng)
          );
          // param pour hide les boutons de choix
          $scope.response = true;

          //accept
          if (state) {
            // zoom
            $scope.map.setZoom(17);
            //avec l'id de la nouvelle invitation, on fait rejoindre l'invité dans la socket room de cet id ou se situe le sender
            socket.emit('joinInvitationRoom', $scope.invitationId);
            socket.emit('guessIsComming', $scope.invitationId);

            // variable qui permet au watcher de savoir si il faut donner au sender la position de l'invité
            // active quand l'invitation est acceptée
            $scope.emitGuessPosition = true;

            //masque les moyens de transports non selectionnes
            angular.element(document.querySelectorAll('.transport:not(.selected)')).css({"display": "none"});

            //obtient le type de moyen de transport
            $scope.validateTransportKind = angular.element(document.querySelectorAll('.transport:not(.selected)')).attr('kind');

          }
          //refuse
          else {
            //remove sender marker
            $scope.markerSender.setMap(null);
            // remove directions
            directionsDisplay.setMap(null);
            // chache la div
            $scope.showDirection = false;
            // zoom
            $scope.map.setZoom(15);
          }
        }
    });

    // start the watcher géoloc
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

           if ($scope.emitGuessPosition) {
             //donne au sender ma position
             socket.emit('giveGuessPosition', $scope.invitationId, newlatlng);

             $scope.majTransportDuration(newlatlng, $scope.markerSender.position, $scope.validateTransportKind);
           }
         }
     );

     $scope.majTransportDuration = function(origin, destination, memoTransport) {
       var transportKind;
       if(memoTransport === 'bicycle') {
         transportKind = google.maps.TravelMode.BICYCLING;
       }
       else if (memoTransport === 'walk') {
         transportKind = google.maps.TravelMode.WALKING;
       }
       else {
         transportKind = google.maps.TravelMode.DRIVING;
       }

       service.getDistanceMatrix(
       {
         origins: [origin],
         destinations: [destination],
         travelMode: transportKind,
       }, callback);

       function callback(response, status) {
         if (status !== google.maps.DistanceMatrixStatus.OK) {
           console.log('Error was: ' + status);
         }
         else {
           // puis affiche le temps de trajet + distance à l'endroit correspondant
           if (memoTransport === "walk") {
             $scope.distance_walk = response.rows[0].elements[0].distance.text + ', ';
             $scope.duration_walk = response.rows[0].elements[0].duration.text;
           }
           else if (memoTransport === "bicycle") {
             $scope.distance_bicycle = response.rows[0].elements[0].distance.text + ', ';
             $scope.duration_bicycle = response.rows[0].elements[0].duration.text;
           }
           else {
             $scope.distance_car = response.rows[0].elements[0].distance.text + ', ';
             $scope.duration_car = response.rows[0].elements[0].duration.text;
           }
         }
       }
     }

     // change les directions en fonction du moyen de transport
     // params:
     // origin : point de départ
     // destination
     // transportKind : parametre google pour le type (google.maps.TravelMode.xxx)
     // memoTransport : string passée depuis le template html
     $scope.renderDirection = function(origin, destination, transportKind, memoTransport) {
       var request = {
         origin: origin,
         destination : destination,
         travelMode : transportKind,
       };
       // trace itineraire
       directionsService.route(request, function(result, status) {
         if (status == google.maps.DirectionsStatus.OK) {
           directionsDisplay.setDirections(result);

           // calcul le temps du trajet
           service.getDistanceMatrix(
           {
             origins: [origin],
             destinations: [destination],
             travelMode: transportKind,
           }, callback);

           function callback(response, status) {
             if (status !== google.maps.DistanceMatrixStatus.OK) {
               console.log('Error was: ' + status);
             }
             else {
               // puis affiche le temps de trajet + distance à l'endroit correspondant
               if (memoTransport === "walk") {
                 $scope.distance_walk = response.rows[0].elements[0].distance.text + ', ';
                 $scope.duration_walk = response.rows[0].elements[0].duration.text;
                 $scope.distance_bicycle = '';
                 $scope.duration_bicycle = '';
                 $scope.distance_car = '';
                 $scope.duration_car = '';
               }
               else if (memoTransport === "bicycle") {
                 $scope.distance_walk = '';
                 $scope.duration_walk = '';
                 $scope.distance_bicycle = response.rows[0].elements[0].distance.text + ', ';
                 $scope.duration_bicycle = response.rows[0].elements[0].duration.text;
                 $scope.distance_car = '';
                 $scope.duration_car = '';
               }
               else {
                 $scope.distance_walk = '';
                 $scope.duration_walk = '';
                 $scope.distance_bicycle = '';
                 $scope.duration_bicycle = '';
                 $scope.distance_car = response.rows[0].elements[0].distance.text + ', ';
                 $scope.duration_car = response.rows[0].elements[0].duration.text;
               }
             }
           }
         }
       });
     }
  });
})
