starter.controller('ContactCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicPopup, $cordovaToast) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.contacts = allContacts;
      $ionicLoading.hide();
    });
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
  $scope.showPopup = function (contact) {
    $scope.data = {};
    $scope.currentContact = contact;
    $scope.popupContactToGroup = $ionicPopup.show({
      templateUrl: 'templates/popupContact.html',
      title: contact.displayName,
      scope: $scope,
      buttons: [{
         text: 'Cancel'
      }, {
         text: '<b>Add</b>',
         type: 'button-positive',
         onTap: function(e) {
           if (typeof($scope.data.group) !== 'undefined') {
             $cordovaToast.showShortBottom(contact.displayName + ' added to group ' + $scope.data.group)
             .then(function(success) {
              }, function (error) {
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
         text: '<b>Add</b>',
         type: 'button-positive',
         onTap: function(e) {
           if (typeof($scope.newGroupData.newGroupLabel) !== 'undefined') {
             $cordovaToast.showShortBottom($scope.currentContact.displayName + ' added to new group ' + $scope.newGroupData.newGroupLabel)
             .then(function(success) {
              }, function (error) {
              });
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

  // disable swipe on the view
  $ionicSideMenuDelegate.canDragContent(false);

  // on pc
  if ((ionic.Platform.platform() === 'linux') || new Ionic.IO.Settings().get('isPC')) {
    console.log('Start on PC : no contacts');
    // fictif contact object
    $scope.contacts = [
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
