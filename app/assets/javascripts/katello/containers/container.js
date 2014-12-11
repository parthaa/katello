/**
 Copyright 2014 Red Hat, Inc.

 This software is licensed to you under the GNU General Public
 License as published by the Free Software Foundation; either version
 2 of the License (GPLv2) or (at your option) any later version.
 There is NO WARRANTY for this software, express or implied,
 including the implied warranties of MERCHANTABILITY,
 NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 have received a copy of GPLv2 along with this software; if not, see
 http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
*/

var KT = KT ? KT : {};

KT.container = (function(){
    var setup = function() {
        var envDropdown = $('#kt_environment_id'),
            contentViewDropdown = $('#content_view_id'),
            reposDropdown = $("#repository_id"),
            tagsDropdown = $("#tag_id");
        envDropdown.change(populateContentViews);
        contentViewDropdown.change(populateRepositories);
        reposDropdown.change(populateTags);
        resetContentViews();

    },
    getOrg = function() {
        return $('#kt_environment_id').data()["organization"];
    },
    getEnvironment = function() {
        return $('#kt_environment_id').val();
    },
    getContentView = function() {
        return $('#content_view_id').val();
    },
    getRepo = function() {
        return $('#repository_id').val();
    },
    populateContentViews = function() {
        var contentViewDropdown = $('#content_view_id'),
            env = getEnvironment(),
            url = "/katello/api/organizations/" + getOrg() + "/content_views",
            params = {
                environment_id : env
            };

        resetContentViews();
        if (env !== "") {
            $.getJSON(url, params)
                .done(function(data) {
                        $.each(data["results"], function(index, cv) {
                            contentViewDropdown.append(
                                $('<option></option>').val(cv["id"]).html(cv["name"]));
                        });
                        enableContentViews(true);
                })
                .fail(function(resp) {
                    button.removeClass('disabled');
                });
        }
    },
    populateRepositories = function() {
        var reposDropdown = $("#repository_id"),
            cv = getContentView(),
            url = "/katello/api/repositories/",
            params = {
                organization_id: getOrg(),
                content_view_id: cv,
                environment_id: getEnvironment(),
                content_type: "docker"
            };

        resetRepositories();
        if (cv !== "") {
            $.getJSON(url, params)
                .done(function(data) {
                        $.each(data["results"], function(index, repo) {
                            reposDropdown.append(
                                $('<option></option>').val(repo["id"]).html(repo["name"]));
                        });
                        enableRepositories(true);
                })
                .fail(function(resp) {
                    button.removeClass('disabled');
                });
        }
    },
    populateTags = function() {
        var repo = getRepo(),
            tagsDropdown = $("#tag_id"),
            url = "/katello/api/repositories/" + repo + "/docker_tags",
            params = {};

        resetTags();

        if (repo !== "") {
            $.getJSON(url, params)
                .done(function(data) {
                        $.each(data["results"], function(index, tag) {
                            tagsDropdown.append(
                                $('<option></option>').val(tag["id"]).html(tag["tag"]));
                        });
                        enableTags(true);
                })
                .fail(function(resp) {
                    button.removeClass('disabled');
                });
        }
    },
    resetContentViews = function() {
        resetRepositories();
        $('#content_view_id option[value!=""]').remove();
        enableContentViews(false);
    },
    resetRepositories = function() {
        resetTags();
        $('#repository_id option[value!=""]').remove();
        enableRepositories(false);
    },
    resetTags = function() {
        $('#tag_id option[value!=""]').remove();
        enableTags(false);
    },
    enableContentViews = function(enable) {
        $('#content_view_id').prop("disabled", !enable);
    },
    enableRepositories = function(enable) {
        $('#repository_id').prop("disabled", !enable);
    },
    enableTags = function(enable) {
        $('#tag_id').prop("disabled", !enable);
    };

    return {
        setup: setup
    };
})();


$(document).ready(function() {
    KT.container.setup();
});


// //wait until the entire page is loaded, to ensure images and things are downloaded
// $(window).load(function() {
//     $(".loading").each(function(){
//        KT.dashboard.widgetReload($(this));
//     });

// });
