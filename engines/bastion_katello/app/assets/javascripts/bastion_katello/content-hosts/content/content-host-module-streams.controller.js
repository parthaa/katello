/**
 * @ngdoc object
 * @name  Bastion.content-hosts.controller:ContentHostModuleStreamsController
 *
 * @requires $scope
 * @resource $timeout
 * @resource $window
 * @requires HostModuleStream
 * @requires Nutupane
 * @requires ModuleStreamActions
 *
 * @description
 *   Provides the functionality for the content host module streams list and actions.
 */
angular.module('Bastion.content-hosts').controller('ContentHostModuleStreamsController',
    ['$scope', '$timeout', '$window', 'HostModuleStream', 'Nutupane', 'BastionConfig', 'ModuleStreamActions',
    function ($scope, $timeout, $window, HostModuleStream, Nutupane, BastionConfig, ModuleStreamActions) {
        $scope.moduleStreamActions = ModuleStreamActions.getActions();

        $scope.working = false;

        $scope.moduleStreamsNutupane = new Nutupane(HostModuleStream, {
            'id': $scope.$stateParams.hostId
        });

        $scope.moduleStreamsNutupane.masterOnly = true;
        $scope.table = $scope.moduleStreamsNutupane.table;

        $scope.remoteExecutionPresent = BastionConfig.remoteExecutionPresent;
        $scope.remoteExecutionByDefault = BastionConfig.remoteExecutionByDefault;
        $scope.moduleStreamActionFormValues = {
            authenticityToken: $window.AUTH_TOKEN.replace(/&quot;/g, ''),
            remoteAction: 'module_stream_action'
        };

        $scope.performViaRemoteExecution = function(moduleSpec, actionType) {
            $scope.working = true;
            $scope.moduleStreamActionFormValues.moduleSpec = moduleSpec;
            $scope.moduleStreamActionFormValues.moduleStreamAction = actionType;
            $scope.moduleStreamActionFormValues.hostIds = $scope.host.id;

            $timeout(function () {
                angular.element('#moduleStreamActionForm').submit();
            }, 0);
        };
    }
]);
