starter.controller('SettingsCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $cordovaDialogs, $cordovaCamera) {

  $scope.chooseSource = function() {
    $cordovaDialogs.confirm('Choose your source', 'Profil picture', ['Camera','Galery'])
    .then(function(buttonIndex) {
      // callback succes
      // camera
      if (buttonIndex === 1) {
        var optionsCamera = {
           quality: 50,
           destinationType: Camera.DestinationType.DATA_URL,
           correctOrientation:true
        };
        $cordovaCamera.getPicture(optionsCamera).then(function(imageData) {
          var image = document.getElementById('profil-picture');
          image.src = "data:image/jpeg;base64," + imageData;
          if (image.width > image.height) {
            image.style.removeProperty('width');
            image.style.height = "100%";
          }
          else {
            image.style.removeProperty('height');
            image.style.width = "100%";
          }
        }, function(err) {
          // error
        });
      }
      //galery
      else {
        var optionsGalery = {
           quality: 50,
           destinationType: Camera.DestinationType.DATA_URL,
           sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        };

        $cordovaCamera.getPicture(optionsGalery).then(function(imageData) {
          var image = document.getElementById('profil-picture');
          image.src = "data:image/jpeg;base64," + imageData;
          if (image.width > image.height) {
            image.style.removeProperty('width');
            image.style.height = "100%";
          }
          else {
            image.style.removeProperty('height');
            image.style.width = "100%";
          }
        }, function(err) {
          // error
        });
      }
    });
  }

});
