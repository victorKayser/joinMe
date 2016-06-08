starter.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $stateParams, $http, $rootScope, $cordovaToast, getUserInfosByPhone, $cordovaDeviceOrientation, $interval) {
  //arrivée sur l'appli
  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  socket.on('authentification', function() {
      console.log('socket server authentification : OK billy');
  });

  socket.on('getGuessPosition', function(position, guessPhone) {
    NgMap.getMap().then(function(map) {
      if (!$scope.guessMarker) {

        var guessImg;
        if (typeof(getUserInfosByPhone.getInfos(guessPhone)) !== 'undefined') {
          guessImg = getUserInfosByPhone.getInfos(guessPhone).image_path;
        }
        else {
          guessImg = "img/marker-user.png";
        }
        $scope.guessMarker = new google.maps.Marker({
           position: position,
           map: map,
           title: 'test',
           draggable: false,
           icon: {
             url : guessImg,
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

  $scope.bounds = new google.maps.LatLngBounds();

  if(!new Ionic.IO.Settings().get('isPC')) {

    $rootScope.push.on('notification', function(data) {
        // quand notif pour nouvelle invit, on ajoute la marker du sender sur la map
        if (typeof(data.additionalData.invitationId !== 'undefined')) {
          $scope.invitationId = data.additionalData.invitationId;

          $http.post(new Ionic.IO.Settings().get('serverUrl') + '/getInvitationInfos',
          {
            invitation_id : data.additionalData.invitationId,
            user_id : JSON.parse(window.localStorage['user']).id_users,
          })
          .then(function successCallback(invitation) {
            // si l'invitation est toujours actuelle
            if (invitation.data.length > 0) {
              var sender_position = invitation.data[0].sender_position;

              var senderLat = parseFloat(sender_position.split(', ')[0]);
              var senderLng = parseFloat(sender_position.split(', ')[1]);

              var senderPhone = invitation.data[0].sender_phoneNumber;

              var senderImg;
              if ((typeof(getUserInfosByPhone.getInfos(senderPhone)) !== 'undefined') && (getUserInfosByPhone.getInfos(senderPhone).image_path !== "")) {
                  senderImg = getUserInfosByPhone.getInfos(senderPhone).image_path;
              }
              else {
                senderImg = "img/marker-user.png";
              }

              $scope.emojiPath = invitation.data[0].emoji_path;

              NgMap.getMap().then(function(map) {
                // crée le marker du sender
                $scope.markerSender = new google.maps.Marker({
                   position: {lat: senderLat, lng: senderLng},
                   map: map,
                   title: 'test',
                   draggable: false,
                   icon: {
                     url : senderImg,
                     scaledSize: new google.maps.Size(20, 20)
                   }
                });
                // ajoute a l'objet bounds le marker pour pouvoir zoomer automatiquement en fonction des markers
                $scope.bounds.extend($scope.markerSender.position);
              });
            }
            // invitation terminée
            else {

            }
          }
          , function errorCallback(err) {
            console.log(err);
          });
        }
        // notif pour nouvel invité recue par le sender
        else {

        }

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
       $scope.map.setZoom(16);
       // init the marker
       $scope.markerLocalisation = new google.maps.Marker({
          position: {lat: lat, lng: lng},
          map: map,
          title: 'test',
          draggable: false,
          icon: {
            path : 'M17 32c-0.072 0-0.144-0.008-0.217-0.024-0.458-0.102-0.783-0.507-0.783-0.976v-15h-15c-0.469 0-0.875-0.326-0.976-0.783s0.129-0.925 0.553-1.123l30-14c0.381-0.178 0.833-0.098 1.13 0.199s0.377 0.749 0.199 1.13l-14 30c-0.167 0.358-0.524 0.577-0.906 0.577zM5.508 14h11.492c0.552 0 1 0.448 1 1v11.492l10.931-23.423-23.423 10.931z',
          }
        });

        // start the watcher for phone orientation
        var options = {
           frequency: 1500
        }
        var watch = $cordovaDeviceOrientation.watchHeading(options).then(
         null,
         function(error) {
           // An error occurred
         },
         function(result) {   // updates constantly (depending on frequency value)
           var magneticHeading = result.magneticHeading;
           var icon = $scope.markerLocalisation.get('icon');
           icon.rotation = result.magneticHeading;
           $scope.markerLocalisation.set('icon', icon);
         }
        );

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

            var user_id = JSON.parse(window.localStorage['user']).id_users;

            socket.emit('guessIsComming', $scope.invitationId, user_id);

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
            $scope.map.setZoom(16);
          }
        }

        // lors de l'arrivée sur la carte, essai de récupérer si il y a des invitations en cours
        // ou l'user en question est le sender
        $http.post(new Ionic.IO.Settings().get('serverUrl') + '/checkPendingInvitation',
        {
          user_id : JSON.parse(window.localStorage['user']).id_users,
        })
        .then(function successCallback(invitations) {
            socket.emit('joinPendingInvitationRoom', invitations.data);
        }, function errorCallback(err) {
          console.log(err);
        });

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
             var myPhone = JSON.parse(window.localStorage['user']).phone_number;
             socket.emit('giveGuessPosition', $scope.invitationId, newlatlng, myPhone);

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
