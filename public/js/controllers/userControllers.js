'use strict';

/**********************************************************************
 * Module - For Controllers
 **********************************************************************/
angular.module('myApp.userControllers', ['ngFileUpload'])

/**********************************************************************
 Main Controller
 **********************************************************************/
.controller('MainCtrl', function ($scope, $http, $location, $window, AuthenticationService, $rootScope, $log, userService, base64) {

  $scope.message = {
    error:"",
    success:"",
    info:""
  };

  if (AuthenticationService.isLogged) {
    $log.info("Logged in already!!!!"); //TEST
    $scope.message.info = "You are Logged in already - You will be diverted to /admin Automatically!!!!";
    //$location.path("/admin");
  }

  /*
  If JWT exists in session storage (i.e. user logged in)
  Extract username from JWT
  */
  if($window.sessionStorage.token) {
    userService.loggedOnAlreadyMsg();
  }
})


/**********************************************************************
 Register controller
 **********************************************************************/
.controller('RegisterCtrl', function ($scope, $http, $location, $window, AuthenticationService, $rootScope, $log, userService) {

  $scope.message = {
    error:"",
    success:"",
    info:""
  };


  $scope.register = function register(username, password, passwordConfirm) {

      if (AuthenticationService.isLogged) {
        $log.info("Logged in already!!!!"); //TEST
        $scope.message.info = "You are Logged in already!!!!";
        $location.path("/admin");
      }
      else {
        //Request
        userService.registerUser($scope.user)
        //Response Handler
        .then(function(user) {
          $log.info("You are now Registered");
          $scope.message.success = "You are now Registered";
          $location.path("/login");
        },
        function(error) {
          $log.info("Error when trying to Register");
          $scope.message.success = "";
          $scope.message.error = error;
        })
    };
  }
})

/**********************************************************************
 * Login controller
 **********************************************************************/
.controller('LoginCtrl', function ($scope, $http, $location, $window, AuthenticationService, $rootScope, userService, base64) {

  //$scope.error = '';

  $scope.message = {
    error:"",
    success:"",
    info:""
  };

  $scope.login = function() {

    //Request
    userService.loginUser($scope.user)
      //Response Handler
      .then(function(profile) {
          AuthenticationService.isLogged = true;      //Logged In **
          $scope.message.error = "";
          $scope.message.success = "You have successfully logged on!!";
          $rootScope.welcome = 'Welcome ' + JSON.stringify(profile.username) + " | ";
      },
      function(error) {
        AuthenticationService.isLogged = false; //NOT Logged In **
        //Handle login errors here
        $scope.message.error = 'Invalid username or password';
        $scope.message.success = "";
        $rootScope.welcome = 'Invalid User';
      });
    }


    /*
    If JWT exists in session storage (i.e. user logged in)
    Extract username from JWT
    */
    if($window.sessionStorage.token) {
      userService.loggedOnAlreadyMsg();
    }
})

/**********************************************************************
 * Admin controller
 **********************************************************************/
.controller('AdminCtrl', function($scope, $http, $location, AuthenticationService, $window, $rootScope, userService, Upload) {

  $scope.message = {
    error:"",
    success:"",
    info:""
  };

	var key = CryptoJS.lib.WordArray.random(128/8);
  var salt = CryptoJS.lib.WordArray.random(128/8);
  var iv = CryptoJS.lib.WordArray.random(128/8);

	$scope.succeed = false
	$scope.key_log = key

	var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(key));

	$('<a href="data:' + data + '" download="key">Download Key</a>').appendTo('#json');

  //Request
  userService.getAdmin()
    //Response Handler
    .then(function(profile) {
        AuthenticationService.isLogged = true;      //Logged In
        $scope.message.error = "";
        $rootScope.welcome = 'Welcome ' + JSON.stringify(profile.username);
      },
      function(error) {
        AuthenticationService.isLogged = false; //Logged Out
        //Handle login errors here
        $scope.message.error = "Unable to access /admin";
        $rootScope.welcome = "";
        $location.url('/login');
      });

      $scope.submit = function(){ //function to call on form submit
				if ($scope.upload_form.file.$valid && $scope.file) { //check if form is valid
					var ciphertext = CryptoJS.AES.encrypt(JSON.stringify($scope.file), key, {
							iv: iv,
							mode: CryptoJS.mode.CBC,
							padding: CryptoJS.pad.Pkcs7
					});
					var encryptedFile = new File([ciphertext], $scope.file.name + '.encrypted', {
							type: $scope.file.type,
							lastModified: $scope.file.lastModified
					});
					console.log(encryptedFile);
					$scope.upload(encryptedFile);
			}
      }

      $scope.upload = function (file) {
          Upload.upload({
              url: 'http://localhost:8800/upload', //webAPI exposed to upload the file
              data:{file:file} //pass file as data, should be user ng-model
          }).then(function (resp) { //upload function returns a promise
              if(resp.data.error_code === 0){ //validate success
                  $window.alert('Success ' + resp.config.data.file.name + ' uploaded.');
									$scope.succeed = true
              } else {
                  $window.alert('an error occured');
              }
          }, function (resp) { //catch error
              console.log('Error status: ' + resp.status);
              $window.alert('Error status: ' + resp.status);
          }, function (evt) {
              console.log(evt);
              var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
              console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
              $scope.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
          });
      };
})


/**********************************************************************
 * Logout controller
 **********************************************************************/
.controller('LogoutCtrl', function($scope, $http, $window, $location,
  AuthenticationService, $rootScope, $log, userService) {

  $scope.message = {
    error:"",
    success:"",
    info:""
  };

  //Request
  userService.logoutUser()
    //Response Handler
    .then(function(profile) {
      AuthenticationService.isLogged = false;      //Logged In **
      $scope.message.error = "";
      $scope.message.success = "You have logged out successfully!!";
      $log.info("You have logged out successfully!!")
      $location.url('/login');
    },
    function(error) {
      AuthenticationService.isLogged = false; //NOT Logged In **
      $log.info("Error logging out!!")
      $scope.message.error = "Error logging out!!";
      $scope.message.success = "";
    });
})


/**********************************************************************
* About controller
**********************************************************************/
.controller('AboutCtrl', function($scope, $window, $rootScope, base64, $log, userService) {

    $scope.message = {
      error:"",
      success:"",
      info:"Look! I am an about page."
    };

		$scope.files = [{ "value":40,"color":"#F5A623" },{ "value":60,"color":"#F5A623" },{ "value":80,"color":"#F5A623" },{ "value":100,"color":"#F5A623" }];
		$scope.current_file = ''
		//Request
		userService.getFileList({
				url: 'http://localhost:8800/download', //webAPI exposed to upload the file
		}).then(function (resp) { //upload function returns a promise
				$scope.file_array = resp
		}, function (resp) { //catch error
				console.log('Error status: ' + resp.status);
				$window.alert('Error status: ' + resp.status);
		}, function (evt) {
				console.log(evt);
				var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
				console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
				$scope.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
		});

		$scope.download = function(filename) {
			console.log(filename);

	    //window.open('/download_file')
			userService.getFile({
					url: 'http://localhost:8800/download_file', //webAPI exposed to upload the file
					data:{filename} //pass file as data, should be user ng-model
			}).then(function (resp) { //upload function returns a promise
					console.log(resp);
					window.alert(resp)
					$scope.current_file = resp
			}, function (resp) { //catch error
					console.log('Error status: ' + resp.status);
					$window.alert('Error status: ' + resp.status);
			}, function (evt) {
					console.log(evt);
					var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
					console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
					$scope.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
			});
		}


    /*
    If JWT exists in session storage (i.e. user logged in)
    Extract username from JWT
    */
    if($window.sessionStorage.token) {
      userService.loggedOnAlreadyMsg();
    }
});
