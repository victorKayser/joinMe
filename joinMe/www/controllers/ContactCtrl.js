starter.controller('ContactCtrl', function($scope, $state, $cordovaContacts, $ionicPlatform) {
  $scope.getAllContacts = function() {
    $cordovaContacts.find({})
    .then(function(allContacts) {
      $scope.contacts = allContacts;
    });
  };

  $scope.getAllContacts();

})
