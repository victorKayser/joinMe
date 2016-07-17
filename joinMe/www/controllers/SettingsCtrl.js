starter.controller('SettingsCtrl', function($scope, $state, NgMap, $cordovaGeolocation, $cordovaDialogs, $cordovaCamera, $cordovaFile, $ionicLoading, $cordovaFileTransfer, $http, $timeout) {

  $scope.addPicture = function() {
    $cordovaDialogs.confirm('Choose your source', 'Profil picture', ['Camera','Galery'])
    .then(function(buttonIndex) {
      // callback succes
      // camera
      if (buttonIndex === 1) {
        var optionsCamera = {
           quality: 50,
           destinationType: Camera.DestinationType.FILE_URI,
           correctOrientation:true
        };
      }
      //galery
      else {
        var optionsCamera = {
           quality: 50,
           destinationType: Camera.DestinationType.FILE_URI,
           sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        };
      }
      // obtient la picture
      $cordovaCamera.getPicture(optionsCamera).then(function(imageData) {
        // loader
        $ionicLoading.show({
          template: '<ion-spinner icon="android"/>'
        });
        // redimentionne l'image
        $scope.resizeImage(imageData, function(url_resized) {

          var uniqFileName = $scope.guid();
          var url = new Ionic.IO.Settings().get('serverUploadFilePath');
          var targetPath = url_resized;
          var options = {
            fileName: uniqFileName,
          };
          // upload
          $cordovaFileTransfer.upload(url, targetPath, options)
          .then(function(result) {
            // Upload Success!
            // affiche image
            var image = document.getElementById('profil-picture');
            image.src = new Ionic.IO.Settings().get('serverUploadDirectory') + uniqFileName + '.jpeg';
            if (image.width > image.height) {
              image.style.removeProperty('width');
              image.style.height = "100%";
            }
            else {
              image.style.removeProperty('height');
              image.style.width = "100%";
            }
            $ionicLoading.hide();

            // ajoute à l'user en bdd l'image
            $scope.setUserImage(uniqFileName + '.jpeg', function(err, res){
              // puis rentre le chemin dans le ls
              if (!err) {
                var user = JSON.parse(window.localStorage['user']);
                user.image_path = uniqFileName + '.jpeg';
                window.localStorage['user'] = JSON.stringify(user);
              }
            });

          }, function(err) {
            console.log(err);
            // Error
          }, function (progress) {
            console.log(progress);
            // constant progress updates
          });

        });
      }, function(err) {
        // error
      });
    });
  }

  $scope.guid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4() + '-' + s4() + s4() + s4();
  }

  $scope.resizeImage = function(url, callback) {

      if (url === ''){
          callback(null);
      }
      var sourceImage = new Image();

      sourceImage.onload = function() {
          // Create a canvas with the desired dimensions
          var ratio = sourceImage.height/sourceImage.width;
          var canvas = document.createElement('canvas');
          if (ratio > 1) {// portrait
              canvas.width = 800/ratio;
              canvas.height = 800;
          }
          else {
              canvas.width = 800;
              canvas.height = 800*ratio;
          }
          // Scale and draw the source image to the canvas
          canvas.getContext('2d').drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

          callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      sourceImage.src = url;
  }

  // met en bdd le chemin de la nouvelle image pour la personne
  $scope.setUserImage = function (image, done) {
    var phoneNumber = JSON.parse(window.localStorage['user']).phone_number;
    $http.post(new Ionic.IO.Settings().get('serverUrl') + '/setUserImage',
    {
      phoneNumber : phoneNumber,
      image_path : image,
    })
    .then(function successCallback(res) {
      done(null, res);
    }
    , function errorCallback(err) {
      done(err);
    });
  }

  // check si l'user a une image (dans le LS)
  var user = JSON.parse(window.localStorage['user']);
  if (user.image_path !== "") {
    $timeout(function() {
      var path = new Ionic.IO.Settings().get('serverUploadDirectory') + user.image_path;
      $('.profil-picture').attr('src', path);
      if ($('.profil-picture').width() > $('.profil-picture').height()) {
        $('.profil-picture').css('width', '');
        $('.profil-picture').css('height', '100%');
      }
      else {
        $('.profil-picture').css('height', '');
        $('.profil-picture').css('width', '100%');
      }
    }, 1000);

  }

});
