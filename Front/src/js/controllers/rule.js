(function() {

  angular.module('app')
    .controller('RuleCtrl', [
        '$scope', '$mdDialog', '$timeout', 'Rule',
        RuleCtrl
    ]);

function RuleCtrl($scope, $mdDialog, $timeout, Rule) {
    $scope.app.subtitle = 'Rule';

    $scope.query = {
        limit: '10',
        order: 'id',
        page: 1
    };

    $scope.filterOptions = {
        debounce: 500
    };

    function success(items) {
        $scope.items = items;
    }
    $scope.getList = function () {
        $scope.promise = Rule.get($scope.query, success).$promise;
    };

    $scope.$watch('query.order', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.query.page = 1;
        }
        if(oldValue) {
            $scope.getList();
        }
    });

    $scope.search = function () {
        $scope.query = {
            limit: '10',
            order: 'id',
            page: 1,
            q: $scope.query.q
        };
        $scope.getList();
    };

    $scope.fab = [];
    var cacheToggle = [];
    $scope.toggleFab = function(idx, open) {
        $scope.fab[idx].isOpen = open;
        if (open) {
            cacheToggle[idx] = $timeout(function() {
                $scope.fab[idx].tooltipVisible = true;
            }, 600);
        } else {
            if (cacheToggle[idx]) {
                $timeout.cancel(cacheToggle[idx]);
                cacheToggle[idx] = null;
            }
            $scope.fab[idx].tooltipVisible = false;
        }
    };

    $scope.editItem = function (ev, item) {
        $mdDialog.show({
            clickOutsideToClose: false,
            controller: ['$scope', '$mdDialog', 'Rule', editItemCtrl],
            controllerAs: 'ctrl',
            focusOnOpen: false,
            locals: { item: item, currentUser: $scope.currentUser },
            bindToController: true,
            targetEvent: ev,
            templateUrl: 'tpl/rule-edit-dialog.html',
        }).then($scope.getList);
    };

    $scope.deleteItem = function (ev, item) {
        $mdDialog.show({
            clickOutsideToClose: true,
            controller: ['$mdDialog', 'Rule', deleteCtrl],
            controllerAs: 'ctrl',
            focusOnOpen: false,
            targetEvent: ev,
            locals: { item: item },
            bindToController: true,
            templateUrl: 'tpl/delete-confirm-dialog.html',
        }).then($scope.getList);
    };
}

function editItemCtrl($scope, $mdDialog, Rule) {
    $scope.currentUser = angular.copy(this.currentUser);
    if (this.item) {
        $scope.item = angular.copy(this.item);
        this.title = "edit";
    } else {
        $scope.item = {
            payout: '0'
        };
        this.title = "add";
    }
    this.cancel = $mdDialog.cancel;

    function success(item) {
        $mdDialog.hide(item);
    }

    this.save = function () {
        $scope.editForm.$setSubmitted();

        if ($scope.editForm.$valid) {
            Rule.save($scope.item, success);
        }
    };
}

function deleteCtrl($mdDialog, Rule) {
    this.title = "delete";
    this.content = 'warnDelete';

    this.cancel = $mdDialog.cancel;

    function deleteItem(item) {
        var deferred = Rule.remove({id: item.id});
        return deferred.$promise;
    }

    this.ok = function() {
        deleteItem(this.item).then(success, error);
    };

    function success() {
        console.log("success delete");
        $mdDialog.hide();
    }

    function error() {
        this.error = 'Error occured when delete.';
    }
}

})();
