starter.controller('MapCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $stateParams, $http, $rootScope, $cordovaToast, getUserInfosByPhone, $cordovaDeviceOrientation, $timeout, $ionicPopup, $ionicPlatform) {
  //arrivée sur l'appli
  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  $scope.guestMarker = [];

  // variables tache de fond ou pas pour ne pas recevoir quand app en background les positions des invités
  // revient de tache de fond
  $ionicPlatform.on('resume', function() {
    $scope.onBackground = false;
  });

  // va en tache de fond
  $ionicPlatform.on('pause', function() {
    $scope.onBackground = true;
  });

  socket.on('authentification', function() {
      console.log('socket server authentification : OK billy');
  });

  socket.on('getGuessPosition', function(position, guestPhone, invitationId) {
    if (!$scope.onBackground) {
      $scope.invitationId = invitationId;
      if (!$scope.showClosePendingInvitation) {
        // affiche le bouton qui permet de finir a tout moment l'invitation en cours
        $scope.showClosePendingInvitation = true;
      }

      NgMap.getMap().then(function(map) {
        if (!$scope.stopReceiveGuestPosition) {
          if (($scope.guestPhone) && (!$scope.guestPhone.visible)) {
            $scope.guestPhone.setMap(map);
            $scope.guestPhone.setVisible(true);
            $ionicPopup.alert({
               title: 'Informations',
               template: guestName + ' arrive vers vous.',
            });
          }
          if (!$scope.guestPhone) {
            var guessImg;
            if (typeof getUserInfosByPhone.getInfos(guestPhone) !== 'undefined') {
              if (getUserInfosByPhone.getInfos(guestPhone).image_path.indexOf('.jpeg') > -1) {
                guessImg = getUserInfosByPhone.getInfos(guestPhone).image_path;
              }
              else {
                guessImg = "img/marker-user.png";
              }
              guestName = getUserInfosByPhone.getInfos(guestPhone).displayName;
            }
            else {
              guessImg = "img/marker-user.png";
              guestName = guestPhone;
            }

            $ionicPopup.alert({
               title: 'Informations',
               template: guestName + ' arrive vers vous.',
            });

            $scope.guestPhone = new google.maps.Marker({
               position: position,
               map: map,
               title: guestPhone,
               draggable: false,
               icon: {
                 url : guessImg,
                 scaledSize: new google.maps.Size(20, 20)
               }
             });
             $scope.guestMarker.push($scope.guestPhone);

             $scope.bounds.extend($scope.guestPhone.position);
             map.fitBounds($scope.bounds);
          }
          else {
            $scope.guestPhone.setPosition(position);
          }
        }
      });
    }
  });

  socket.on('preventSenderGuestArrived', function(phone) {
    if (typeof getUserInfosByPhone.getInfos(phone) !== 'undefined') {
      guest = getUserInfosByPhone.getInfos(phone).displayName;
    }
    else {
      guest = phone;
    }
    // prevenir de l'arrivée de l'invité
    $ionicPopup.alert({
       title: 'Cogratutations !',
       template: guest + ' is arrived.',
    });

    // cache le bouton qui permet de finir a tout moment l'invitation en cours
    $scope.showClosePendingInvitation = false;
  });

  $scope.bounds = new google.maps.LatLngBounds();

  if(!new Ionic.IO.Settings().get('isPC')) {

    $rootScope.push.on('notification', function(data) {
        // quand notif pour nouvelle invit, on ajoute la marker du sender sur la map
        if (typeof data.additionalData.invitationId !== 'undefined') {
          if (typeof getUserInfosByPhone.getInfos(data.additionalData.sender_phoneNumber) !== 'undefined') {
            guest = getUserInfosByPhone.getInfos(data.additionalData.sender_phoneNumber).displayName;
          }
          else {
            guest = data.additionalData.sender_phoneNumber;
          }

          $ionicPopup.alert({
             title: 'Nouvelle invitation!',
             template: guest + ' souhaite vous voir!',
          });

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
              if ((typeof getUserInfosByPhone.getInfos(senderPhone) !== 'undefined') && (getUserInfosByPhone.getInfos(senderPhone).image_path !== "")) {
                if (getUserInfosByPhone.getInfos(senderPhone).image_path.indexOf('.jpeg') > -1) {
                  senderImg = getUserInfosByPhone.getInfos(senderPhone).image_path;
                }
                else {
                  senderImg = "img/marker-user.png";
                }
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

                // donc on fitBounds càd zoom propre en fonction de tous les markers
                map.fitBounds($scope.bounds);
                //affiche la div du bottom pour le choix des moyens de transports
                $scope.showDirection = true;

                $scope.emitGuessPosition = false;

                $cordovaGeolocation.getCurrentPosition().then(function(position){
                   var lat = position.coords.latitude;
                   var lng = position.coords.longitude;

                   // trace itinéraire piéton par défaut + temps de voyage
                   $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.WALKING, "walk");
                   angular.element(document.querySelectorAll('div.transport')).removeClass('selected');
                   angular.element(document.querySelectorAll('div.walk')).addClass('selected');
                });
              });
            }
            //invitation terminée
            else {

            }
          }
          , function errorCallback(err) {
            console.log(err);
          });
        }
        // invitation terminée a l'inivitative du sender
        else if(typeof data.additionalData.senderCloseInvitation !== 'undefined') {
          var senderPhoneNumber = data.additionalData.senderPhoneNumber;
          if (typeof getUserInfosByPhone.getInfos(senderPhoneNumber) !== 'undefined') {
            guest = getUserInfosByPhone.getInfos(senderPhoneNumber).displayName;
          }
          else {
            guest = senderPhoneNumber;
          }
          $scope.emitGuessPosition = false;

          socket.emit('leaveRoom', data.additionalData.leavedInvitation);
          //remove sender marker
          $scope.markerSender.setMap(null);
          // remove directions
          $scope.directionsDisplay.set('directions', null);
          // chache la div
          $scope.showDirection = false;
          $scope.response = false;
          $scope.showClosePendingInvitation = false;
          angular.element(document.querySelectorAll('div.transport:not(.selected)')).css({"display": "block"});
          $ionicPopup.alert({
             title: 'Informations',
             template: guest + ' a mit fin à l\'invitation.',
          });
        }

        // invitation terminée a l'inivitative de l'invité
        else if(typeof data.additionalData.guestCloseInvitation !== 'undefined') {
          var guestPhoneNumber = data.additionalData.guestPhoneNumber;
          if (typeof getUserInfosByPhone.getInfos(guestPhoneNumber) !== 'undefined') {
            guest = getUserInfosByPhone.getInfos(guestPhoneNumber).displayName;
          }
          else {
            guest = guestPhoneNumber;
          }
          //supprime le marker de l'invité qui quitte
          for(var marker in $scope.guestMarker) {
            if ($scope.guestMarker[marker].title === guestPhoneNumber) {
              $scope.guestMarker[marker].setMap(null);
              $scope.guestMarker[marker].setVisible(false);
            }
          }
          var remainingGuestNumber = data.additionalData.remainingGuestNumber;
          // s'il reste des invités qui viennent (qui eux n'ont pas mit fin a l'invitation)
          if (remainingGuestNumber > 1) {
            $ionicPopup.alert({
               title: 'Informations',
               template: guest + ' ne vous rejoint désormais plus.',
            });
          }
          else {
            // l'invité qui met fin est le dernier
            socket.emit('leaveRoom', data.additionalData.leavedInvitation);
            $scope.showClosePendingInvitation = false;
            $ionicPopup.alert({
               title: 'Informations',
               template: guest + ' ne vous rejoint désormais plus.',
            }).then(function() {
              $cordovaToast.showShortBottom(guest + ' était le dernier, l\'invitation est terminée.');
            });
          }
        }
        // un invité a accepté l'invitation
        else if(typeof data.additionalData.guestIsComming !== 'undefined') {
          if (typeof getUserInfosByPhone.getInfos(data.additionalData.guestPhone) !== 'undefined') {
            guest = getUserInfosByPhone.getInfos(data.additionalData.guestPhone).displayName;
          }
          else {
            guest = data.additionalData.guestPhone;
          }
          $cordovaToast.showShortBottom(guest + ' a accepté votre invitation.');
        }
    });
  }

  NgMap.getMap().then(function(map) {
    $scope.map = map;

    // supprime les boutons de zoom et compagnie sur la map par défaut
    map.setOptions({disableDefaultUI: true});

    // Init des variables pour les directions et le temps de voyage
    $scope.directionsDisplay = new google.maps.DirectionsRenderer();
    $scope.directionsService = new google.maps.DirectionsService();
    $scope.service = new google.maps.DistanceMatrixService();
    $scope.directionsDisplay.setMap(map);


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
            path : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#00b6ff',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ccc9c9',
            scale: 8,
            rotation: 180,
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
        if (typeof $scope.markerSender !== 'undefined') {
          // donc on fitBounds càd zoom propre en fonction de tous les markers
          map.fitBounds($scope.bounds);
          //affiche la div du bottom pour le choix des moyens de transports
          $scope.showDirection = true;

          // trace itinéraire piéton par défaut + temps de voyage
          $scope.renderDirection(new google.maps.LatLng(lat, lng), $scope.markerSender.position, google.maps.TravelMode.WALKING, "walk");
          angular.element(document.querySelectorAll('div.walk')).addClass('selected');
         }

        // au click sur différent moyens de transport
        $scope.changeTransportKind = function(kind) {
          angular.element(document.querySelectorAll('div.transport')).removeClass('selected');
          angular.element(document.querySelectorAll('div.'+kind)).addClass('selected');

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

        $scope.responseInvitation = function(state, id_invitation) {
          var invitationId;

          if(typeof id_invitation === 'undefined') {
            invitationId = $scope.invitationId;
          }
          else {
            invitationId = id_invitation;
          }
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
            socket.emit('joinInvitationRoom', invitationId);

            var user_id = JSON.parse(window.localStorage['user']).id_users;
            var phone = JSON.parse(window.localStorage['user']).phone_number;

            socket.emit('guessIsComming', invitationId, user_id, phone);

            // variable qui permet au watcher de savoir si il faut donner au sender la position de l'invité
            // active quand l'invitation est acceptée
            $scope.emitGuessPosition = true;

            //masque les moyens de transports non selectionnes
            angular.element(document.querySelectorAll('div.transport:not(.selected)')).css({"display": "none"});

            //obtient le type de moyen de transport
            $scope.validateTransportKind = angular.element(document.querySelectorAll('div.transport.selected')).attr('kind');

            // affiche le bouton qui permet de finir a tout moment l'invitation en cours
            $scope.showClosePendingInvitation = true;
          }
          //refuse
          else {
            //remove sender marker
            $scope.markerSender.setMap(null);
            // remove directions
            $scope.directionsDisplay.set('directions', null);
            // chache la div
            $scope.showDirection = false;
            $scope.response = false;
            // zoom
            $scope.map.setZoom(16);
          }
        }

        // lors de l'arrivée sur la carte, essai de récupérer si il y a des invitations en cours
        // ou l'user en question est le sender
        $http.post(new Ionic.IO.Settings().get('serverUrl') + '/checkSenderPendingInvitation',
        {
          user_id : JSON.parse(window.localStorage['user']).id_users,
        })
        .then(function successCallback(invitations) {
            socket.emit('joinPendingInvitationRoom', invitations.data);
        }, function errorCallback(err) {
          console.log(err);
        });

        // au cas contraire essai de récupérer si l'invité a des invitations en cours
        $http.post(new Ionic.IO.Settings().get('serverUrl') + '/checkGuestPendingInvitation',
        {
          user_id : JSON.parse(window.localStorage['user']).id_users,
        })
        .then(function successCallback(invitations) {
          // si en tant qu'invité nous avons une/des invitation en cours
          if (invitations.data.length > 0) {
            // donc on fitBounds càd zoom propre en fonction de tous les markers
            map.fitBounds($scope.bounds);
            //affiche la div du bottom pour le choix des moyens de transports
            $scope.showDirection = true;

            $scope.emitGuessPosition = true;
            // trace itinéraire piéton par défaut + temps de voyage
            $scope.renderDirection(new google.maps.LatLng(lat, lng), invitations.data[0].sender_position, google.maps.TravelMode.WALKING, "walk");
            angular.element(document.querySelectorAll('div.transport.walk')).addClass('selected');

            $timeout(function(){
              $scope.responseInvitation(true, invitations.data[0].id_invitations);
            }, 1000);

            $scope.invitationId = invitations.data[0].id_invitations

            $http.post(new Ionic.IO.Settings().get('serverUrl') + '/getInvitationInfos',
            {
              invitation_id : invitations.data[0].id_invitations,
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
                if ((typeof getUserInfosByPhone.getInfos(senderPhone) !== 'undefined') && (getUserInfosByPhone.getInfos(senderPhone).image_path !== "")) {
                  if (getUserInfosByPhone.getInfos(senderPhone).image_path.indexOf('.jpeg') > -1) {
                    senderImg = getUserInfosByPhone.getInfos(senderPhone).image_path;
                  }
                  else {
                    senderImg = "img/marker-user.png";
                  }
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

                  // affiche le bouton qui permet de finir a tout moment l'invitation en cours
                  $scope.showClosePendingInvitation = true;
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

        }, function errorCallback(err) {
          console.log(err);
        });

    });

    // start the watcher géoloc
     var watch = $cordovaGeolocation.watchPosition({
         frequency: 1000,
         timeout: 1000,
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

           if ($scope.emitGuessPosition) {
             //donne au sender ma position
             var myPhone = JSON.parse(window.localStorage['user']).phone_number;

             // émet au sender la position a minimum x secondes d'interval (pour éviter de l'envoyer trop)

             $scope.now = new Date();

             if (!$scope.lastEmit) {
               socket.emit('giveGuessPosition', $scope.invitationId, newlatlng, myPhone);
               $scope.lastEmit = new Date();
             }
             if ( ($scope.lastEmit) && ( (($scope.now - $scope.lastEmit) / 1000) >= 3) ) {
               socket.emit('giveGuessPosition', $scope.invitationId, newlatlng, myPhone);
               $scope.lastEmit = new Date();
             }

             if (typeof $scope.validateTransportKind === 'undefined') {
               $scope.validateTransportKind = "walk";
             }
             $scope.majTransportDuration(newlatlng, $scope.markerSender.position, $scope.validateTransportKind, $scope.invitationId);
           }
         }
     );

     // met fin a une invitation qui a été acceptée
     $scope.stopInvitation = function() {
       $scope.stopReceiveGuestPosition = true;
       // un invité, donc delete le marker sender + les infos d'itineraire
       if (typeof $scope.markerSender !== 'undefined') {
         $scope.emitGuessPosition = false;
         //remove sender marker
         $scope.markerSender.setMap(null);
         // remove directions
         $scope.directionsDisplay.set('directions', null);
         // chache la div
         $scope.showDirection = false;
         $scope.response = false;

         // prévient le sender que l'invité quitte l'invitation
         socket.emit('preventSenderInvitationClose', $scope.invitationId, JSON.parse(window.localStorage['user']).phone_number);
       }
       else {
         socket.emit('preventGuestInvitationClose', $scope.invitationId, JSON.parse(window.localStorage['user']).phone_number);
         // le sender, donc supprime les markers des invités
         for(var marker in $scope.guestMarker) {
           $scope.guestMarker[marker].setMap(null);
           $scope.guestMarker[marker].setVisible(false);
         }
       }

       $scope.showClosePendingInvitation = false;

       angular.element(document.querySelectorAll('div.transport:not(.selected)')).css({"display": "block"});

       $http.post(new Ionic.IO.Settings().get('serverUrl') + '/closeInvitation',
       {
         invitation_id : $scope.invitationId,
         user_id : JSON.parse(window.localStorage['user']).id_users,
       })
       .then(function successCallback(data) {
         $scope.stopReceiveGuestPosition = false;

       }, function errorCallback(err) {
         console.log(err);
       });
     };

     $scope.majTransportDuration = function(origin, destination, memoTransport, invitationId) {
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

       $scope.service.getDistanceMatrix(
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
             $('span.transport.walk').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
           }
           else if (memoTransport === "bicycle") {
             $('span.transport.bicycle').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
           }
           else {
             $('span.transport.car').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
           }
           // si les personnes sont toutes proches, alors la course est terminée
           if (response.rows[0].elements[0].distance.value <= new Ionic.IO.Settings().get('minInvitationDistance')) {
             // l'invité est arrivé, on met en bdd comme quoi l'invitation est terminée
             $http.post(new Ionic.IO.Settings().get('serverUrl') + '/closeInvitation',
             {
               invitation_id : invitationId,
               user_id : JSON.parse(window.localStorage['user']).id_users,
             })
             .then(function successCallback(data) {

               socket.emit('leaveRoom', invitationId);

               $scope.emitGuessPosition = false;
               //remove sender marker
               $scope.markerSender.setMap(null);
               // remove directions
               $scope.directionsDisplay.set('directions', null);
               // chache la div
               $scope.showDirection = false;
               $scope.response = false;
               // zoom
               $scope.map.setZoom(16);
               var myPhone = JSON.parse(window.localStorage['user']).phone_number;
               socket.emit('guestArrived', invitationId, myPhone);

               // cache le bouton qui permet de finir a tout moment l'invitation en cours
               $scope.showClosePendingInvitation = false;
               angular.element(document.querySelectorAll('div.transport:not(.selected)')).css({"display": "block"});

             }, function errorCallback(err) {
               console.log(err);
             });
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
       $scope.directionsService.route(request, function(result, status) {
         if (status == google.maps.DirectionsStatus.OK) {
           $scope.directionsDisplay.setDirections(result);

           // calcul le temps du trajet
           $scope.service.getDistanceMatrix(
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
                $('span.transport.walk').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
                $('span.transport.bicycle').empty();
                $('span.transport.car').empty();
               }
               else if (memoTransport === "bicycle") {
                 $('span.transport.walk').empty();
                 $('span.transport.bicycle').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
                 $('span.transport.car').empty();
               }
               else {
                 $('span.transport.walk').empty();
                 $('span.transport.bicycle').empty();
                 $('span.transport.car').html(response.rows[0].elements[0].distance.text + ', ' + response.rows[0].elements[0].duration.text);
               }
             }
           }
         }
       });
     }
  });
})
