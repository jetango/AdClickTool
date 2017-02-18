(function () {
  'use strict';

  angular.module('app')
    .controller('SubscriptionsCtrl', [
      '$scope', '$mdDialog', 'Profile', 'Billing',
      SubscriptionsCtrl
    ]);

  function SubscriptionsCtrl($scope, $mdDialog, Profile, Billing) {
    $scope.app.subtitle = 'Subscriptions';

    Profile.get(null, function (profile) {
      if (profile.data) {
        Billing.get({timezone: profile.data.timezone}, function (bill) {
          $scope.item = bill.data.activeSubscription;
        });
      }
    });

    $scope.changePlan = function(ev, item){
      $mdDialog.show({
        bindToController: true,
        targetEvent: ev,
        clickOutsideToClose: false,
        controllerAs: 'ctrl',
        controller: ['$scope', '$mdDialog', 'Profile', 'Billing', changePlanCtrl],
        focusOnOpen: false,
        locals: {
          item: item
        },
        bindToController: true,
        templateUrl: 'tpl/change-paln-dialog.html'
      });
    };
  }

  function changePlanCtrl($scope, $mdDialog, Profile, Billing){
    this.cancel = $mdDialog.cancel;

    $scope.editChangePlan = function(ev,item){
      $mdDialog.show({
        multiple: true,
        skipHide: true,
        bindToController: true,
        targetEvent: ev,
        clickOutsideToClose: false,
        controllerAs: 'ctrl',
        controller: ['$scope', '$mdDialog', 'Profile', 'Billing', editChangePlanCtrl],
        focusOnOpen: false,
        locals: {
          item: item
        },
        bindToController: true,
        templateUrl: 'tpl/edit-change-paln-dialog.html'
      });
    };
  }

  function editChangePlanCtrl($scope, $mdDialog, Profile, Billing){
    this.cancel = $mdDialog.cancel;
  }
})();
