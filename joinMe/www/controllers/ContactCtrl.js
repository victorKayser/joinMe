starter.controller('ContactCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform, $ionicLoading, $ionicTabsDelegate, $ionicSideMenuDelegate) {
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

  // disable swipe on the view
  $ionicSideMenuDelegate.canDragContent(false);
  
  // on pc
  if ((ionic.Platform.platform() === 'linux') || new Ionic.IO.Settings().get('isPC')) {
    console.log('Start on PC : no contacts');
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
