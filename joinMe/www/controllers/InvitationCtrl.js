
starter.controller('InvitationCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicPopup, $cordovaToast) {
  // disable swipe on the view
  $ionicSideMenuDelegate.canDragContent(false);
  // get all contacts
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.contacts = allContacts;
    	$ionicLoading.hide();
    });
  };
  // render 2 objets (number.png) for two rows of emoji
  $scope.renderEmoji = function() {
    var numberEmoji = 25;
    $scope.objEmojiRaw1 = [];
    $scope.objEmojiRaw2 = [];

    for(i=1; i<=numberEmoji; i=i+2) {
      $scope.objEmojiRaw1.push(i+'.png');
    }
    for(i=2; i<=numberEmoji; i=i+2) {
      $scope.objEmojiRaw2.push(i+'.png');
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
  $scope.validateInvitation = function() {
    // emoji set ?
    if (typeof($scope.emojiIsValidate) !== 'undefined') {
      // contact set ?
      if ($scope.invitationToContact.length > 0) {
        // message toast
        $cordovaToast.showShortBottom('Invitation sended...').then(function(success) {
          // redirect to map view
           $state.go('map');
         }, function (error) {
           // error
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

  $scope.doIfChecked = function(res, phoneNumber) {
    // add contact (number)
    if (res) {
      $scope.invitationToContact.push({number: phoneNumber[0].value});
    }
    // remove contact of the object
    else {
      angular.forEach($scope.invitationToContact, function(value, key) {
        if (value.number === phoneNumber[0].value) {
          $scope.invitationToContact.splice(key, 1);
        }
      });
    }
  }

  // on pc
  if ((ionic.Platform.platform() === 'linux') || new Ionic.IO.Settings().get('isPC')) {
    console.log('Start on PC : no contacts');
    $scope.renderEmoji();
  }
  // mobile
  else {
    // loader
    $ionicLoading.show({
      template: '<ion-spinner icon="android"/>'
    });
    $scope.renderEmoji();
    $scope.getAllContacts();
  }
});
