/**
 * @ngdoc object
 * @name  Bastion.content-hosts.controller:ContentHostModuleStreamsController
 *
 * @requires $scope
 * @resource $timeout
 * @resource $window
 * @requires ModuleStream
 * @requires translate
 * @requires Nutupane
 * @requires Notification
 *
 * @description
 *   Provides the functionality for the content host module streams list and actions.
 */
angular.module('Bastion.content-hosts').controller('ContentHostModuleStreamsController',
    ['$scope', '$timeout', '$window', 'ModuleStream', 'translate', 'Nutupane', 'BastionConfig', 'Notification',
    function ($scope, $timeout, $window, ModuleStream, translate, Nutupane, BastionConfig, Notification) {
        var moduleStreamActions;

        $scope.moduleStreamsNutupane = new Nutupane(ModuleStream, {
            'host_ids': [$scope.$stateParams.hostId]
        });

        $scope.moduleStreamsNutupane.masterOnly = true;
        $scope.table = $scope.moduleStreamsNutupane.table;

        $scope.openEventInfo = function (event) {
            // when the event has label defined, it means it comes
            // from foreman-tasks
            if (event.label) {
                $scope.transitionTo('content-host.tasks.details', {taskId: event.id});
            } else {
                $scope.transitionTo('content-host.events.details', {eventId: event.id});
            }
            $scope.working = false;
        };

        $scope.errorHandler = function (response) {
            angular.forEach(response.data.errors, function (responseError) {
                Notification.setErrorMessage(responseError);
            });
            $scope.working = false;
        };

        $scope.working = false;
        $scope.remoteExecutionPresent = BastionConfig.remoteExecutionPresent;
        $scope.remoteExecutionByDefault = BastionConfig.remoteExecutionByDefault;
        $scope.moduleStreamActionFormValues = {
            authenticityToken: $window.AUTH_TOKEN.replace(/&quot;/g, '')
        };

        $scope.performViaRemoteExecution = function(actionType, customize) {
            $scope.moduleStreamActionFormValues.moduleStreamIds = $scope.selectedModuleStreamIds().join(',');
            $scope.moduleStreamActionFormValues.remoteAction = actionType;
            $scope.moduleStreamActionFormValues.hostIds = $scope.host.id;
            $scope.moduleStreamActionFormValues.customize = customize;

            $timeout(function () {
                angular.element('#moduleStreamActionForm').submit();
            }, 0);
        };

        $scope.selectedModuleStreamIds = function () {
            var moduleStreamIds = [], selected = $scope.table.getSelected();
            angular.forEach(selected, function (value) {
                moduleStreamIds.push(value.id);
            });
            return moduleStreamIds;
        };
    }
]);
