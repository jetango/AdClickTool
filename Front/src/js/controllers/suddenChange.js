(function () {
  'use strict';

  angular.module('app')
    .controller('suddenChangeCtrl', [
      '$scope', '$mdDialog', 'toastr','SuddenChange', 'Logs', 'LogDetail', 'DateRangeUtil', 'BlackList', '$timeout',
      suddenChangeCtrl
    ]);

  function suddenChangeCtrl($scope,  $mdDialog, toastr, SuddenChange, Logs, LogDetail, DateRangeUtil, BlackList, $timeout) {
    $scope.app.subtitle = 'Sudden Change';

    $scope.ths = [
      {name:'Rule Name'},
      {name:'Dimension'},
      {name:'TimeSpan'}
    ];

    $scope.viewLogs = function(tr){
      $mdDialog.show({
        clickOutsideToClose: false,
        controller: ['$scope', '$mdDialog', 'LogDetail', ruleLogCtrl],
        controllerAs: 'ctrl',
        focusOnOpen: false,
        locals: {data:tr},
        bindToController: true,
        templateUrl: 'tpl/rule-log-dialog.html?' + +new Date()
      });
    };

    $scope.query = {
      status: 1,
      filter:'',
      page: 1,
      limit: 1000
    };

    // 账户类型对rule的数量的限制
    $scope.ruleLimit = $scope.permissions.report.suddenchange.scRuleLimit;

    $scope.tabSelected = 0;
    $scope.getRuleList = function(){
      var params = angular.copy($scope.query);
      if (!params.filter) {
        delete params.filter;
      }
      SuddenChange.get(params,function(result){
        $scope.list = result.data;
      });
    };
    $scope.getRuleList();

    $scope.datetype = '1';
    $scope.queryLog = {
      filter:'',
      page: 1,
      limit: 1000
    };
    $scope.getLogList = function(){
      var params = angular.copy($scope.queryLog);
      if(!params.filter) {
        delete params.filter;
      }
      Logs.get(params, function(result){
        $scope.loglist = result.data;
      });
    };
    getDateRange($scope.datetype);
    $scope.getLogList();

    getDateRange($scope.datetype);

    function getDateRange(value) {
      var fromDate = DateRangeUtil.fromDate(value);
      var toDate = DateRangeUtil.toDate(value);
      if (value == '0') {
        $scope.queryLog.from = moment().format('YYYY-MM-DD');
        $scope.queryLog.to = moment().add(1, 'days').format('YYYY-MM-DD');
      } else {
        $scope.queryLog.from = fromDate;
        $scope.queryLog.to = toDate;
      }
    }

    $scope.statusChange = function(){
      $scope.getRuleList();
    };
    $scope.logQueryChange = function(){
      getDateRange($scope.datetype);
      $scope.getLogList();
    };

    $scope.blacklistCount = 20;

    $scope.getBlackList = function () {
      BlackList.get(null, function (blacklist) {
        $scope.data = blacklist.data;
      });
    };

    $scope.getBlackList();

    $scope.editRuleItem = function(item) {
      $mdDialog.show({
        clickOutsideToClose: true,
        escapeToClose: false,
        controller: ['$scope', '$mdDialog', "$q", 'AutomatedRuleOptions', 'Campaign', 'AutomatedRule', 'EmailValidate', editRuleCtrl],
        controllerAs: 'ctrl',
        focusOnOpen: false,
        bindToController: true,
        locals: {item: item},
        templateUrl: 'tpl/automatedRule-edit-dialog.html?' + +new Date()
      }).then(function(id) {
        if(!id) {
          $scope.query.status = 0;
        }
        if($scope.tabSelected != 0) {
          $scope.tabSelected = 0;
        }
        $scope.getRuleList();
      });
    }

    $scope.deleteRuleItem = function(id){
      $mdDialog.show({
        clickOutsideToClose: true,
        escapeToClose: false,
        controller: ['$scope', '$mdDialog', 'SuddenChange', deleteRuleCtrl],
        controllerAs: 'ctrl',
        focusOnOpen: false,
        locals: {id: id},
        bindToController: true,
        templateUrl: 'tpl/delete-rule-dialog.html?' + +new Date()
      }).then(function() {
        $scope.getRuleList();
      });
    };

    $scope.ruleStatusChange = function(index){
      if($scope.list.rules[index].status == 0){
        $scope.list.rules[index].status = 1;
      }else{
        $scope.list.rules[index].status = 0;
      }
      SuddenChange.save($scope.list.rules[index], function(oData) {
        if(oData.status == 1) {
          $scope.getRuleList();
        }
      });
    };
  }

  function editRuleCtrl($scope, $mdDialog, $q, AutomatedRuleOptions, Campaign, AutomatedRule, EmailValidate) {
    // init load data
    var initPromises = [], prms;
      if (this.item) {
        this.title = "edit";
        var theData;
        prms = AutomatedRule.get({id: this.item.id}, function(result) {
          theData = result.data;
        }).$promise;
        initPromises.push(prms);
      } else {
        this.title = "add";
        $scope.conditionArray = [
          {
            "key": "sumImps",
            "operand": ">",
            "value": ""
          }
        ];
        $scope.item = {
          "dimension": "WebSiteId",
          "timeSpan": "last3hours",
        };
      }
      $scope.frequency = "Every 1 Hour";
      $scope.freDate = new Date();
      $scope.freWeek = "0";
      $scope.freTime = "0";

      this.titleType = "Rule";

      $scope.dimensions = AutomatedRuleOptions.dimension;
      $scope.timeSpans = AutomatedRuleOptions.timeSpan;
      $scope.conditions = AutomatedRuleOptions.condition;
      $scope.frequencys = AutomatedRuleOptions.frequency;

      var conditionMap = {};
      $scope.conditions.forEach(function(con) {
        conditionMap[con.key] = con.unit;
      })
      $scope.conditionMap = conditionMap;

      $scope.hours = [];
      for (var i=0; i<24; ++i) {
        if (i < 10) {
          $scope.hours.push({key: i.toString(), display: '0' + i + ':00'});
        } else {
          $scope.hours.push({key: i.toString(), display: i + ':00'});
        }
      }
      $scope.weeks = [
        {key: "0", display: "Sunday"},
        {key: "1", display: "Monday"},
        {key: "2", display: "Tuesday"},
        {key: "3", display: "Wednesday"},
        {key: "4", display: "Thursday"},
        {key: "5", display: "Friday"},
        {key: "6", display: "Saturday"},
      ];

      $scope.campaignFilter = {
        config: {
            plugins: ['remove_button'],
            valueField: 'id',
            labelField: 'name',
            searchField: ['name']
        },
        options: []
      };

      // 获取所有campaign
      prms = Campaign.get(null, function(result) {
        if (result.status) {
          $scope.campaignFilter.options = result.data;
        }
      }).$promise;
      initPromises.push(prms);

      function initSuccess() {
        if (theData) {
          $scope.item = theData;
          $scope.item.campaigns = $scope.item.campaigns.split(",");
          $scope.conditionArray = fillConditionArray($scope.item.condition);
          parseScheduleString($scope);
        }
      }

      $q.all(initPromises).then(initSuccess);

      $scope.conditionDisable = function(item, index) {
        var selectConditions = $scope.conditionArray.map(function(con) {
          return con.key;
        });
        var selectIdx = selectConditions.indexOf(item.key);
        return selectIdx > -1 && selectIdx != index;
      }

      $scope.addCondition = function() {
        var key;
        var selectConditions = $scope.conditionArray.map(function(con) {
          return con.key;
        });
        var isBreak = false;
        $scope.conditions.forEach(function(con) {
            if (selectConditions.indexOf(con.key) < 0 && !isBreak) {
              key = con.key;
              isBreak = true;
            }
        });
        $scope.conditionArray.push({
          "key": key,
          "operand": ">",
          "value": ""
        });
      };

      $scope.deleteCondition = function(condition) {
        var idx = $scope.conditionArray.indexOf(condition);
        if (idx >= 0) {
          $scope.conditionArray.splice(idx, 1);
        }
      };

      $scope.validateEmail = function() {
        var isValid = EmailValidate.validate($scope.item.emails);
        $scope.editForm.email.$setValidity('emailValid', isValid);
      }

      // 是否显示日期选择框
      $scope.showDateSelect = function() {
        return ['One Time'].indexOf($scope.frequency) >= 0;
      };
      // 是否显示星期选择框
      $scope.showWeekSelect = function() {
        return ['Weekly'].indexOf($scope.frequency) >= 0;
      };
      // 是否显示时间选择框
      $scope.showTimeSelect = function() {
        return ['Daily', 'Weekly', 'One Time'].indexOf($scope.frequency) >= 0;
      };

      this.save = function() {
        $scope.editForm.$setSubmitted();
        if ($scope.editForm.$valid) {
          // crontab格式处理, 0(秒) 0(分) *(时) *(天) *(月) *(星期)
          formateCrontab($scope);
          // condition
          var condition = "";
          $scope.conditionArray.forEach(function(con) {
            condition = condition +  con.key + con.operand + con.value + ",";
          });
          $scope.item.condition = condition;
          var params = angular.copy($scope.item);
          params.campaigns = params.campaigns.join(',')
          $scope.saveStatus = true;
          AutomatedRule.save(params, success);
        }
      }

      function success(item) {
        $scope.saveStatus = false;
        if(item.status == 0) {
          $scope.errMessage = item.message;
          return;
        } else {
          $mdDialog.hide($scope.item.id);
        }
      }

      this.cancel = $mdDialog.cancel;
    }

  function ruleLogCtrl($scope, $mdDialog, LogDetail){
    this.cancel = $mdDialog.cancel;
    LogDetail.get({id:this.data.id},function(result){
      $scope.detailItem = result.data;
    });
    $scope.rule = {
      name:  this.data.name,
      dimension: this.data.dimension
    };
  }

  function deleteRuleCtrl($scope, $mdDialog, SuddenChange){
    this.cancel = $mdDialog.cancel;
    this.title = 'confirm delete';
    this.content = 'are you sure you want to delete this rule';

    this.ok = function(){
      SuddenChange.remove({'id': this.id},function(){
        $mdDialog.hide();
      });
    };
  }

  // 根据condition字符串获取数组
  function fillConditionArray(conStr) {
    var conditions = conStr.split(",");
    var conditionArray = [];
    conditions.forEach(function(con) {
      var newCon;
      if (con.indexOf(">") > 0) {
        newCon = {
          "key": con.substring(0, con.indexOf(">")),
          "operand": ">",
          "value": Number(con.substring(con.indexOf(">")+1))
        }
      } else if (con.indexOf("<") > 0) {
        newCon = {
          "key": con.substring(0, con.indexOf("<")),
          "operand": "<",
          "value": Number(con.substring(con.indexOf("<")+1))
        }
      }
      if (newCon) {
        conditionArray.push(newCon);
      }
    });
    return conditionArray;
  }

  // crontab格式处理, 0(秒) 0(分) *(时) *(天) *(月) *(星期)
  function formateCrontab($scope) {
    if ($scope.frequency == "Daily") {
      $scope.item.schedule = "0 0 " + $scope.freTime + " * * *";
      $scope.item.scheduleString = $scope.frequency + " " + $scope.freTime;
    } else if ($scope.frequency == "Weekly") {
      $scope.item.schedule = "0 0 " + $scope.freTime + " * * " + $scope.freWeek;
      $scope.item.scheduleString = $scope.frequency + " " + $scope.freWeek + " " + $scope.freTime;
    } else if ($scope.frequency == "One Time") {
      var freDate = moment($scope.freDate).format('YYYY-MM-DD');
      var dateSplit = freDate.split("-");
      var month = dateSplit[1];
      var daily = dateSplit[2];
      if (month.indexOf(0) == 0) {
        month = month.substring(1);
      }
      if (daily.indexOf(0) == 0) {
        daily = daily.substring(1);
      }
      $scope.item.schedule = "0 0 " + $scope.freTime + " " + daily + " " + month + " *";
      $scope.item.scheduleString = $scope.frequency + " " + freDate + " " + $scope.freTime;
      $scope.item.oneTime = freDate + " " + $scope.freTime;
    } else {
      var time = $scope.frequency.split(" ")[1];
      $scope.item.schedule = "0 0 */" + time + " * * *";
      $scope.item.scheduleString = $scope.frequency;
    }
  }

  // 处理scheduleString
  function parseScheduleString($scope) {
    var schStr = $scope.item.scheduleString.split(" ");
    if ($scope.item.scheduleString.indexOf("Daily") != -1) {
      $scope.frequency = schStr[0];
      $scope.freDate = new Date();
      $scope.freWeek = "0";
      $scope.freTime = schStr[1];
    } else if ($scope.item.scheduleString.indexOf("Weekly") != -1) {
      $scope.frequency = schStr[0];
      $scope.freDate = new Date();
      $scope.freWeek = schStr[1];
      $scope.freTime = schStr[2];
    } else if ($scope.item.scheduleString.indexOf("One Time") != -1) {
      $scope.frequency = "One Time";
      $scope.freDate = new Date(schStr[2]);
      $scope.freWeek = "0";
      $scope.freTime = schStr[3];
    } else if ($scope.item.scheduleString.indexOf("Every") != -1) {
      $scope.frequency = $scope.item.scheduleString;
      $scope.freDate = new Date();
      $scope.freWeek = "0";
      $scope.freTime = "0";
    }

  }


})();