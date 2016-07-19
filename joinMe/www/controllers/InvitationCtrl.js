
starter.controller('InvitationCtrl', function($scope, $rootScope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicPopup, $cordovaToast, $http, $ionicModal, $timeout) {

  var socket = io(new Ionic.IO.Settings().get('serverSocketUrl'));

  // disable swipe on the view
  $ionicSideMenuDelegate.canDragContent(false);

  $scope.gestureClosePopup = function(event) {
    if (event.target.className === 'containerJoinMeNow activated') {
      $rootScope.modal.hide();
    }
  }
  // get all contacts
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.checkKnownUsers(allContacts, function(err, res) {
        if (!err) {
          $scope.contacts = res;
          $rootScope.contacts = res;
          $ionicLoading.hide();
          $scope.renderGroups();
        }
      });
    });
  };

  $scope.checkKnownUsers = function (contacts, done) {
    var filterContact = [];
    contacts.map(function(contact) {
      if ((contact.displayName !== '') && (contact.phoneNumbers !== null)) {
        filterContact.push(contact);
      }
    })
    $http.post(new Ionic.IO.Settings().get('serverUrl') + '/checkKnownUsers',
    {
      contacts : filterContact,
    })
    .then(function successCallback(contactsChecked) {
      window.localStorage['registeredUser'] = JSON.stringify(contactsChecked.data);
      done(null, contactsChecked.data);
    }
    , function errorCallback(err) {
      done(err);
    });
  }

  $scope.renderGroups = function() {
    // si la personne a fait des groups de contacts
    if (typeof(window.localStorage['groups']) !== 'undefined') {
      $rootScope.groupObject = JSON.parse(window.localStorage['groups']);
    }
  }

  // render 2 objets (number.png) for two rows of emoji
  $scope.renderEmoji = function() {
    var numberEmoji = 25;
    $scope.objEmojiRaw1 = [];
    $scope.objEmojiRaw2 = [];

    for(i=1; i<=numberEmoji; i=i+2) {
      $scope.objEmojiRaw1.push(i+'.svg');
    }
    for(i=2; i<=numberEmoji; i=i+2) {
      $scope.objEmojiRaw2.push(i+'.svg');
    }
  };
  // event on the left swipe in the tabs
  $scope.onSwipeLeft = function () {
    var selected = $ionicTabsDelegate.selectedIndex();
    if (selected != -1) {
        $ionicTabsDelegate.select(selected + 1);
    }
  }
  // event on the right swipe in the tabs
  $scope.onSwipeRight = function () {
    var selected = $ionicTabsDelegate.selectedIndex();
    if (selected != -1 && selected != 0) {
        $ionicTabsDelegate.select(selected - 1);
    }
  }
  // set values when emoji is selected
  $scope.validateEmoji = function(state, emoji) {
    $scope.emojiIsValidate = true;
    $scope.selectedEmoji = emoji;
  }
  // validation when click on button send me now
  $scope.validateInvitation = function(e) {
    // emoji set ?
    if (typeof($scope.emojiIsValidate) !== 'undefined') {
      // contact set ?
      if ($scope.invitationToContact.length > 0) {
         // envoi les Invitations
         var user_id = JSON.parse(window.localStorage['user']).id_users;
         var sender_phoneNumber = JSON.parse(window.localStorage['user']).phone_number;
         $http.post(new Ionic.IO.Settings().get('serverUrl') + '/sendInvitation',
         {
           id : user_id,
           invitationObject: $scope.invitationToContact,
           position : JSON.parse(window.localStorage['invitationPosition']),
           emoji: $scope.selectedEmoji,
           sender_phoneNumber : sender_phoneNumber,

         })
         .then(function successCallback(data) {
            //avec l'id de la nouvelle invitation, on fait rejoindre le sender dans la socket room de cet id
            socket.emit('joinInvitationRoom', data.data.invitationId);
            socket.emit('preventSenderInvited', data.data.tabUserId, data.data.invitationId, sender_phoneNumber);
            $cordovaToast.showShortCenter('Invitation sended...');
            $rootScope.modal.hide();
         }
         , function errorCallback(err) {

         });
      }
      // contact no setted
      else {
        var alertPopupContacts = $ionicPopup.alert({
            title: 'Oops!',
            template: 'Who is coming for <img src="img/emoji/'+$scope.selectedEmoji + '"/> ?'
        });
      }
    }
    // emoji not setted
    else {
       var alertPopupEmoji = $ionicPopup.alert({
           title: 'Warning!',
           template: 'You have to set an emoji.'
       });
    }
  }
  // objetc which contains all contact for the invitation
  $scope.invitationToContact = [];

  // incrémente l'objet qui contient les contacts pour l'invitation
  $scope.doIfChecked = function(res, phoneNumber) {
    //supprime les espaces dans le numéro
    phoneNumber = phoneNumber.replace(/\s/g, '');
    // coche la case : add contact (number)
    if (res) {
      //s'il y a du monde
        if (typeof $scope.invitationToContact !== 'undefined' && $scope.invitationToContact.length > 0) {
          // on boucle sur les gens dedans
          var notInsideObject = true;
          angular.forEach($scope.invitationToContact, function(value, key) {
            if (value.number === phoneNumber) {
              notInsideObject = false;
            }
          });
          // et seulement si la personne n'est pas dedans, on l'ajoute
          if (notInsideObject) {
            $scope.invitationToContact.push({number: phoneNumber});
          }
        }
        //sinon personne dedans, on ajoute la personne à l'objet
        else {
          $scope.invitationToContact.push({number: phoneNumber});
        }
    }
    // décoche : remove contact of the object
    else {
      // on boucle sur les gens
      angular.forEach($scope.invitationToContact, function(value, key) {
        // puis on supprime la personne
        if (value.number === phoneNumber) {
          $scope.invitationToContact.splice(key, 1);
        }
      });
    }
  }
  // SOUPE ! sélectionne les contact sur l'onglet contact en fonction du group sélectionné
  $scope.selectContactFromGroup = function(group, checked) {

    // ajoute/enleve une classe selected a chaque contact du group
    angular.element(document.querySelectorAll('.'+group)).toggleClass('selected');
    // boucle sur les contacts appartenant au groupe checké
    angular.forEach(angular.element(document.querySelectorAll('.'+group)), function(contactInGroup, key){
      // boucle sur tous les contacts seuls (onglet contact, pas groupe)
      angular.forEach(angular.element(document.querySelectorAll('.aloneContact')), function(contactAlone, key2){
        //récupère le nom du contact du groupe
        var eachContactIngroupFormated = angular.element(contactInGroup).text().replace(/\s/g, '');
        // récupère le nom du contact indépendant (onglet contact)
        var eachContactAloneFormated = angular.element(contactAlone).text().replace(/\s/g, '');
        // récupère le numéro de téléphone du contact indépendant
        var numberAloneContact = JSON.parse(angular.element(contactAlone).attr('id'))[0].value;
        // pour chaque personne du groupe
        if (eachContactIngroupFormated === eachContactAloneFormated) {
          // on récupère l'élément html correpondant au checkbox de la personne indépendante
          var divCheckbox = angular.element(contactAlone).children()[0];
          var checkbox = angular.element(divCheckbox).children()[0];
          // check un group
          if (checked) {
            // check la personne concernée dans la liste des contacts
            angular.element(checkbox).prop('checked', true);
          }
          //décheck un group
          else {
            var inside = false;
            if(document.querySelectorAll('.htmlContactInGroup.selected').length > 0) {
              // pour chaque contact ayant la classe selected
              angular.forEach(angular.element(document.querySelectorAll('.htmlContactInGroup.selected')), function(value, key3){
                // si dans le groupe que je décoche un contact est coché ailleurs
                if (angular.element(value).attr('phone') === numberAloneContact) {
                  inside = true;
                }
              });
            }
            else {
              angular.element(checkbox).prop('checked', false);
            }
            if (!inside) {
              angular.element(checkbox).prop('checked', false);
            }
          }
          // ajoute ou supprime le contact dans l'objet des invitation
          $scope.doIfChecked(checked, numberAloneContact);
        }
      })
    })
  }


  // on pc
  if ((ionic.Platform.platform() === 'linux') || new Ionic.IO.Settings().get('isPC')) {
    console.log('Start on PC : no contacts');
    $cordovaToast.showShortBottom = function(text) {
      console.log(text);
    }
    $scope.renderEmoji();
    // fictif contact object
    var contacts = [
      {
        displayName: 'Popeye',
        phoneNumbers: [
          {
            value: '0666666666'
          }
        ]
      },
      {
        displayName: 'Dom',
        phoneNumbers: [
          {
            value: '0666666667'
          }
        ]
      },
      {
        displayName: 'Wiko',
        phoneNumbers: [
          {
            value: '0606060606'
          }
        ]
      },
      {
        displayName: 'Vic',
        phoneNumbers: [
          {
            value: '0669312159'
          }
        ]
      }
    ];
    $scope.checkKnownUsers(contacts, function(err, res) {
      if (!err) {
        $scope.contacts = res;
        $ionicLoading.hide();
        $scope.renderGroups();
      }
    });
  }
  // mobile
  else {
    if (!$rootScope.viewedInvitationView) {
      if ($rootScope.contacts) {
        $scope.contacts = $rootScope.contacts;
        $scope.renderEmoji();
      }
      else {
        // loader
        $timeout(function() {
          $ionicLoading.show({
            template: '<ion-spinner icon="android"/>'
          });
          $scope.getAllContacts();
          $scope.renderGroups();
          $scope.renderEmoji();
        }, 400);
      }
      $rootScope.viewedInvitationView = true;

    }
    $scope.renderGroups();
  }
});
