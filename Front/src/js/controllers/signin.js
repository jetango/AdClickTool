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

    Profile.get(null, function (profile) {
      if (!profile.status) {
        return;
      }
      $scope.profile = profile.data;
    });

    $scope.user = {};
    $scope.login = function() {
      $auth.login($scope.user, { ignoreAuthModule: true })
        .then(function() {
          toastr.clear();
          toastr.success('Login success!');
          $scope.$emit('event:auth-loginSuccess');
          if ($scope.profile.homescreen == "dashboard") {
            $state.go('app.dashboard');
          } else {
            $state.go('app.report.campaign');
          }
        })
        .catch(function(response) {
          toastr.error(response.data.message, { timeOut: 7000, positionClass: 'toast-top-center' });
        });
    };
  }
})();
