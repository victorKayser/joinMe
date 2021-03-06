starter.controller('ContactCtrl', function($scope, $rootScope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicPopup, $cordovaToast, $http, $ionicPopover, $timeout) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    // obtient tous les contact du téléphone
    .then(function(allContacts) {
      // maintenant on cherche à savoir qui parmi mes contact est inscrit sur l'appli
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

  $ionicPopover.fromTemplateUrl('templates/popoverContact.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.invitationBySms = function(contact) {

    var confirmPopup = $ionicPopup.confirm({
       title: 'Information',
       template: contact.displayName + ' n\'a pas encore l\'application, voulez vous lui demander de vous rejoindre ?',
       buttons: [
         {
           text: 'Non',
           type: 'btnRougePastel',
         },
         {
           text: 'Oui',
           onTap: function(e) {
             var number = contact.phoneNumbers[0].value;
             var message = 'Rejoins moi sur la nouvelle application JoinMe, tu peux la télécharger ici : www.joinme.com';

             //CONFIGURATION
             var options = {
                 replaceLineBreaks: false, // true to replace \n by a new line, false by default
                 android: {
                     intent: 'INTENT'  // send SMS with the native android SMS messaging
                     //intent: '' // send SMS without open any other app
                 }
             };

             var success = function () { };
             var error = function (e) { console.log('Message Failed:' + e); };
             sms.send(number, message, options, success, error);
           }
         }
       ]
     });
  }


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
  $scope.showPopoverContactOptions = function(contact, $event) {
    $scope.optionContactSetted = contact;
    $scope.popover.show($event);

  };
  $scope.showPopup = function (contact) {
    $scope.data = {};
    if (contact.isRegistered) {
      $scope.currentContact = contact;
      $scope.popupContactToGroup = $ionicPopup.show({
        templateUrl: 'templates/popupContact.html',
        title: contact.displayName,
        scope: $scope,
        buttons: [{
           text: 'Quitter'
        }, {
           text: '<i class="ion-android-done"></i><b> Ajouter</b>',
           type: 'button-positive',
           onTap: function(e) {
             if (typeof($scope.data.group) !== 'undefined') {
               // ajoute la personne dans le groupe
               $scope.addContactInGroup($scope.data.group, contact, function(err, res){
                 if (!err) {
                   $scope.renderGroups();
                   $cordovaToast.showShortBottom(contact.displayName + ' added to group ' + $scope.data.group);
                 }
                 else {
                   $cordovaToast.showShortBottom(contact.displayName + ' already in the group ' + $scope.data.group);
                 }
               });

             }
             else {
               e.preventDefault();
               $cordovaToast.showShortBottom('Please select a group for ' + contact.displayName)
               .then(function(success) {
                }, function (error) {
                });
             }
           }
        }, ]
     });
    }
    // contact non présent sur l'appli
    else {
      var confirmPopup = $ionicPopup.confirm({
        title: contact.displayName + ' doesn\'n have JoinMe',
        template: 'Send an invitation ?'
      });

      confirmPopup.then(function(res) {
        if(res) {
        } else {
        }
      });
    }
  }

  $scope.addNewGroup = function () {
    $scope.newGroupData = {};
    $scope.newGroup = $ionicPopup.show({
      templateUrl: 'templates/popupNewGroup.html',
      title: $scope.optionContactSetted.displayName,
      subTitle: 'Ajouter au nouveau groupe',
      scope: $scope,
      buttons: [{
         text: 'Quitter'
      }, {
         text: '<i class="ion-android-add"></i><b> Ajouter</b>',
         type: 'button-positive',
         onTap: function(e) {
           if (typeof($scope.newGroupData.newGroupLabel) !== 'undefined') {


             //ajoute le nouveau group et la personne dedans
             // ajoute la personne dans le groupe
             $scope.addContactInGroup($scope.newGroupData.newGroupLabel, $scope.optionContactSetted, function(err, res){
               if (!err) {
                 $scope.renderGroups();
                 $cordovaToast.showShortBottom($scope.optionContactSetted.displayName + ' added to new group ' + $scope.newGroupData.newGroupLabel);
               }
               else {
                 $cordovaToast.showShortBottom($scope.optionContactSetted.displayName + ' already in the group ' + $scope.newGroupData.newGroupLabel);
               }
             });
           }
           else {
             e.preventDefault();
             $cordovaToast.showShortBottom('Please set the new group for ' + $scope.optionContactSetted.displayName)
             .then(function(success) {
              }, function (error) {
              });
           }
         }
      }, ]
   });
  }

  $scope.renderGroups = function() {
    // si la personne a fait des groups de contacts
    if (typeof(window.localStorage['groups']) !== 'undefined') {
      $rootScope.groupObject = JSON.parse(window.localStorage['groups']);
    }
  }

  $scope.deleteContactFromGroup = function(group, number) {
    var groupObject = JSON.parse(window.localStorage['groups']);
    groupObject.map(function(eachGroupObject, key){
      if((eachGroupObject.group === group) && (eachGroupObject.phoneNumber === number)) {
        groupObject.splice(key, 1);
      }
    });
    window.localStorage['groups'] = JSON.stringify(groupObject);
    $cordovaToast.showShortBottom('Contact deleted from group ' + group);
    $scope.renderGroups();
  }

  $scope.addContactInGroup = function(group, contact, done) {
    if (typeof(window.localStorage['groups']) === 'undefined') {
      var groupObject = [];
    }
    else {
      var groupObject = JSON.parse(window.localStorage['groups']);
    }
    var isInGroup = false;
    groupObject.map(function(eachGroupObject, key){
      // contact already in this group
      if ((eachGroupObject.group === group) && (eachGroupObject.phoneNumber === contact.phoneNumbers[0].value)) {
        isInGroup = true;
      }
    });
    if (!isInGroup) {
      groupObject.push({
        group : group,
        phoneNumber : contact.phoneNumbers[0].value,
        name : contact.displayName
      });
      window.localStorage['groups'] = JSON.stringify(groupObject);
      done();
    }
    else {
      done('error');
    }
  }

  // disable swipe on the view
  $ionicSideMenuDelegate.canDragContent(false);

  // on pc
  if ((ionic.Platform.platform() === 'linux') || new Ionic.IO.Settings().get('isPC')) {
    console.log('Start on PC : no contacts');
    $cordovaToast.showShortBottom = function(text) {
      console.log(text);
    }
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
        displayName: 'Vic',
        phoneNumbers: [
          {
            value: '0669312159'
          }
        ]
      }
    ];
    // récupère les contacts
    $scope.checkKnownUsers(contacts, function(err, res) {
      if (!err) {
        $scope.contacts = res;
        $ionicLoading.hide();
      }
    });
    // affiche les groups avec les contacts dedans
    $scope.renderGroups();

  }
  // mobile
  else {
    if (!$rootScope.viewedContactView) {
      if ($rootScope.contacts) {
        $scope.contacts = $rootScope.contacts;
      }
      else {
        $timeout(function() {
          // loader
          $ionicLoading.show({
            template: '<ion-spinner icon="android"/>'
          });
          $scope.getAllContacts();
        }, 400);
      }
      $rootScope.viewedContactView = true;
    }
    $scope.renderGroups();
  }

})
