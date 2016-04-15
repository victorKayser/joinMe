starter.controller('ContactCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicPopup, $cordovaToast, $http) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    // obtient tous les contact du téléphone
    .then(function(allContacts) {
      // maintenant on cherche à savoir qui parmi mes contact est inscrit sur l'appli
      $scope.checkKnownUsers(allContacts, function(err, res) {
        if (!err) {
          $scope.contacts = res;
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
  $scope.showPopup = function (contact) {
    $scope.data = {};
    if (contact.isRegistered) {
      $scope.currentContact = contact;
      $scope.popupContactToGroup = $ionicPopup.show({
        templateUrl: 'templates/popupContact.html',
        title: contact.displayName,
        scope: $scope,
        buttons: [{
           text: 'Cancel'
        }, {
           text: '<i class="ion-android-done"></i><b> Add</b>',
           type: 'button-positive',
           onTap: function(e) {
             if (typeof($scope.data.group) !== 'undefined') {
               $cordovaToast.showShortBottom(contact.displayName + ' added to group ' + $scope.data.group);

               // ajoute la personne dans le groupe
               if (typeof(window.localStorage['groups']) === 'undefined') {
                 var groupObject = [];
               }
               else {
                 var groupObject = JSON.parse(window.localStorage['groups']);
               }
               groupObject.push({
                 group : $scope.data.group,
                 phoneNumber : contact.phoneNumbers[0].value,
                 name : contact.displayName
               });
               window.localStorage['groups'] = JSON.stringify(groupObject);

               $scope.renderGroups();
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

    }
  }
  $scope.addNewGroupIndependant = function() {
    $scope.newGroupData = {};
    $scope.newGroupIndependant = $ionicPopup.show({
      templateUrl: 'templates/popupNewGroup.html',
      title: 'Add a new group',
      scope: $scope,
      buttons: [{
         text: 'Cancel'
      }, {
         text: '<i class="ion-android-add"></i><b> Add</b>',
         type: 'button-positive',
         onTap: function(e) {
           if (typeof($scope.newGroupData.newGroupLabel) !== 'undefined') {
             $cordovaToast.showShortBottom('Group ' + $scope.newGroupData.newGroupLabel + ' added.')
             .then(function(success) {
              }, function (error) {
              });
           }
           else {
             e.preventDefault();
             $cordovaToast.showShortBottom('Please set the name of the new group.')
             .then(function(success) {
              }, function (error) {
              });
           }
         }
      }, ]
   });
  }

  $scope.addNewGroup = function () {
    $scope.newGroupData = {};
    $scope.popupContactToGroup.close();
    $scope.newGroup = $ionicPopup.show({
      templateUrl: 'templates/popupNewGroup.html',
      title: $scope.currentContact.displayName,
      subTitle: 'Add to new group',
      scope: $scope,
      buttons: [{
         text: 'Cancel'
      }, {
         text: '<i class="ion-android-add"></i><b> Add</b>',
         type: 'button-positive',
         onTap: function(e) {
           if (typeof($scope.newGroupData.newGroupLabel) !== 'undefined') {
             $cordovaToast.showShortBottom($scope.currentContact.displayName + ' added to new group ' + $scope.newGroupData.newGroupLabel)

             //ajoute le nouveau group et la personne dedans
             // ajoute la personne dans le groupe
             if (typeof(window.localStorage['groups']) === 'undefined') {
               var groupObject = [];
             }
             else {
               var groupObject = JSON.parse(window.localStorage['groups']);
             }
             groupObject.push({
               group : $scope.newGroupData.newGroupLabel,
               phoneNumber : $scope.currentContact.phoneNumbers[0].value,
               name : $scope.currentContact.displayName
             });
             window.localStorage['groups'] = JSON.stringify(groupObject);

             $scope.renderGroups();
           }
           else {
             e.preventDefault();
             $cordovaToast.showShortBottom('Please set the new group for ' + $scope.currentContact.displayName)
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
      $scope.groupObject = JSON.parse(window.localStorage['groups']);
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
    // loader
    $ionicLoading.show({
      template: '<ion-spinner icon="android"/>'
    });
    $scope.getAllContacts();
  }

})
