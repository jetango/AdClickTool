(function () {
  'use strict';

  angular.module('app')
    .controller('EventLogCtrl', [
      '$scope', '$mdDialog', 'Profile', 'Member', 'EventLog', '$q', 'DateRangeUtil',
      EventLogCtrl
    ]);

  function EventLogCtrl($scope, $mdDialog, Profile, Member, EventLog, $q, DateRangeUtil) {
    $scope.app.subtitle = "EventLog";
    $scope.initState = 'init';
    $scope.hours = [];
    for (var i = 0; i < 24; ++i) {
      if (i < 10) {
        $scope.hours.push('0' + i + ':00');
      } else {
        $scope.hours.push('' + i + ':00');
      }
    }
    $scope.fromTime = "00:00";
    $scope.toTime = "00:00";

    $scope.filterDate = {
      fromDate: moment().format('YYYY-MM-DD'),
      toDate: moment().add(1, 'days').format('YYYY-MM-DD'),
      fromTime: "00:00",
      toTime: "00:00"
    };

    $scope.query = {
      page: 1,
      limit: 50
    };

    var initPromise = [], proms;

    var theProfile;
    proms = Profile.get(null, function (profile) {
      theProfile = profile.data;
    }).$promise;
    initPromise.push(proms);

    var theMember;
    proms = Member.get(null, function (members) {
      theMember = members.data;
    }).$promise;
    initPromise.push(proms);

    function initSuccess() {
      if (theProfile) {
        $scope.query.tz = theProfile.timezone;
      }

      $scope.members = theMember.members;
      if (theMember.owner) {
        $scope.filter = {
          userId: 'ALL',
          actionType: 0,
          entityType: 0,
          datetype: "1"
        };
      } else {
        $scope.filter = {
          userId: theMember.members[0].idText,
          actionType: 0,
          entityType: 0,
          datetype: "1"
        };
      }
      $scope.initState = 'success';
    }

    function initError() {
      $scope.initState = 'error';
    }
    $q.all(initPromise).then(initSuccess, initError);

    function success(items) {
      $scope.items = items.data;
    }

    $scope.getList = function () {
      EventLog.get($scope.query, success);
    };

    $scope.refreshDate = function () {
      $scope.getList();
    };

    $scope.$watch('filter', function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      } else {
        $scope.query.page = 1;
      }

      if ($scope.filter.datetype == '0') {
        $scope.query.from = moment($scope.filterDate.fromDate).format('YYYY-MM-DD') + "T" + $scope.filterDate.fromTime;
        $scope.query.to = moment($scope.filterDate.toDate).format('YYYY-MM-DD') + "T" + $scope.filterDate.toTime;
      } else {
        getDateRange($scope.filter.datetype);
        $scope.query.from = $scope.fromDate + "T" + $scope.fromTime;
        $scope.query.to = $scope.toDate + "T" + $scope.toTime;
      }
      $scope.query.userId = $scope.filter.userId;
      $scope.query.actionType = $scope.filter.actionType;
      $scope.query.entityType = $scope.filter.entityType;

      $scope.getList();
    }, true);

    $scope.$watch('filterDate', function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      } else {
        $scope.query.page = 1;
      }
      $scope.query.from = moment($scope.filterDate.fromDate).format('YYYY-MM-DD') + "T" + $scope.filterDate.fromTime;
      $scope.query.to = moment($scope.filterDate.toDate).format('YYYY-MM-DD') + "T" + $scope.filterDate.toTime;

      $scope.getList();
    }, true);

    $scope.detailItem = function (ev, item) {
      $mdDialog.show({
        clickOutsideToClose: false,
        controller: ['$scope', '$mdDialog', detailItemCtrl],
        controllerAs: 'ctrl',
        focusOnOpen: false,
        locals: {item: item},
        bindToController: true,
        targetEvent: ev,
        templateUrl: 'tpl/eventlog-detail-dialog.html?' + +new Date()
      });

    };

    function getDateRange(value) {
      $scope.fromDate = DateRangeUtil.fromDate(value, $scope.query.tz);
      $scope.toDate = DateRangeUtil.toDate(value, $scope.query.tz);
    }
  }

  function detailItemCtrl($scope, $mdDialog) {
    this.title = "Detail";
    $scope.item = this.item;

    this.ok = function() {
      $mdDialog.hide();
    }
  }

})();
