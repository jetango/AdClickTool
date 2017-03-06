(function () {
  'use strict';

  angular.module('app')
    .controller('SigninCtrl', [
      '$scope', '$auth', '$state', 'toastr', '$cookies', 'Profile',
      SigninCtrl
    ]);

  function SigninCtrl($scope, $auth, $state, toastr, $cookies, Profile) {
    $scope.app.subtitle = 'Log in';

    var token = $cookies.get('token');
    var clientId = $cookies.get('clientId');

    if (token && clientId) {
      $auth.setToken(token);
      toastr.clear();
      toastr.success('Login success!');
      $scope.$emit('event:auth-loginSuccess');
      $state.go('app.dashboard');
      return;
    }

    $scope.user = {};
    $scope.login = function() {
      $scope.loginStatus = true;
      $auth.login($scope.user, { ignoreAuthModule: true })
        .then(function(oData) {
          $cookies.put('token', oData.data.token);
          toastr.clear();
          toastr.success('Login success!');
          $scope.$emit('event:auth-loginSuccess');
          Profile.get(null, function (profile) {
            $scope.loginStatus = false;
            if (!profile.status) {
              return;
            }
            if (profile.data.homescreen && profile.data.homescreen == "dashboard") {
              $scope.$state.go('app.dashboard');
            } else {
              $scope.$state.go('app.report.campaign');
            }
          });
        })
        .catch(function(response) {
          $scope.loginStatus = false;
          toastr.error(response.data.message, { timeOut: 7000, positionClass: 'toast-top-center' });
        });
    };
  }
})();
