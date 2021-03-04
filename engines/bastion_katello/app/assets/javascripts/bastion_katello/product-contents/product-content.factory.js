/**
 * @ngdoc factory
 * @name  Bastion.product-contents.factory:ProductContent
 *
 * @requires BastionResource
 *
 * @description
 *   Provides a BastionResource for activation key product contents.
 */
angular.module('Bastion.product-contents').factory('ProductContent',
    ['BastionResource', function (BastionResource) {
        return BastionResource('katello/api/v2/product_contents/:action', {}, {
            get: {method: 'GET', params: {fields: 'full'}},
            autocomplete: {method: 'GET', isArray: true, params: {action: 'auto_complete_search'}},
        });
    }]
);
