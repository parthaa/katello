/**
 * @ngdoc factory
 * @name  Bastion.host-collections.factory:HostCollection
 *
 * @requires BastionResource
 *
 * @description
 *   Provides a BastionResource for host collections.
 */
angular.module('Bastion.host-collections').factory('HostCollection',
    ['BastionResource', function (BastionResource) {

        return BastionResource('/katello/api/host_collections/:id/:action', {id: '@id'}, {
            get: {method: 'GET', params: {fields: 'full'}},
            update: {method: 'PUT'},
            copy: {method: 'POST', params: {action: 'copy'}},
            contentHosts: {method: 'GET', params: {action: 'systems'}},
            removeContentHosts: {method: 'PUT', params: {action: 'remove_systems'}},
            addContentHosts: {method: 'PUT', params: {action: 'add_systems'}},
            autocomplete: {method: 'GET', isArray: true, params: {id: 'auto_complete_search'}}
        });

    }]
);
