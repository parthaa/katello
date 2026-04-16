require "katello_test_helper"

module Katello
  class Api::V2::ContentExportIncrementalsControllerTest < ActionController::TestCase
    include Support::ForemanTasks::Task

    def permissions
      @view_permission = :view_content_views
      @create_permission = :create_content_views
      @update_permission = :edit_content_views
      @destroy_permission = :destroy_content_views
      @export_permission = :export_content
    end

    def setup
      setup_controller_defaults_api
      @library_dev_staging_view = ContentView.find(katello_content_views(:library_dev_staging_view).id)
      @library_view_version = katello_content_view_versions(:library_dev_staging_view_version)
      @organization = @library_dev_staging_view.organization
      permissions
    end

    def create_export_history(version, destination_server, created_at, metadata = {})
      metadata_with_defaults = { format: "syncable", incremental: false }.merge(metadata)
      ::Katello::ContentViewVersionExportHistory.create!(
        content_view_version: version,
        destination_server: destination_server,
        path: "/export/path/#{rand(10000)}",
        created_at: created_at,
        metadata: metadata_with_defaults
      )
    end

    def setup_library_since_test_data
      # Create library export view
      @library_view = ::Katello::ContentView.create!(
        organization: @organization,
        name: ::Katello::ContentView::EXPORT_LIBRARY,
        generated_for: :library_export
      )
      @library_version = @library_view.create_new_version

      @library_old_export = create_export_history(@library_version, "test-server", 2.weeks.ago, { format: "importable", incremental: false })
      @library_recent_export = create_export_history(@library_version, "test-server", 3.days.ago, { format: "importable", incremental: false })
    end

    def setup_repository_since_test_data
      @repository = katello_repositories(:fedora_17_x86_64)

      # Create repository export view
      @repo_view = ::Katello::ContentView.create!(
        organization: @repository.organization,
        name: "Export-#{@repository.label}-#{@repository.library_instance_or_self.id}",
        generated_for: :repository_export
      )
      @repo_version = @repo_view.create_new_version

      @repo_old_export = create_export_history(@repo_version, nil, 2.weeks.ago, { format: "syncable", incremental: false })
      @repo_recent_export = create_export_history(@repo_version, nil, 3.days.ago, { format: "syncable", incremental: false })
    end

    def test_version_protected
      allowed_perms = [@export_permission]
      denied_perms = [@create_permission, @update_permission,
                      @destroy_permission, @view_permission]
      version = @library_dev_staging_view.versions.first

      assert_protected_action(:version, allowed_perms, denied_perms, [@library_dev_staging_view.organization]) do
        post :version, params: { id: version.id }
      end
    end

    def test_library_protected
      allowed_perms = [{name: @export_permission, resource_type: "Organization"}]
      denied_perms = [@create_permission, @update_permission,
                      @destroy_permission, @view_permission]

      org = get_organization
      assert_protected_action(:library, allowed_perms, denied_perms, [org]) do
        post :library, params: { organization_id: org.id }
      end
    end

    def test_version_since_and_from_history_id_conflict
      post :version, params: { id: @library_view_version.id, since: '2024-01-15', from_history_id: 123 }
      assert_response :bad_request
      assert_match(/cannot.*both.*since.*from_history_id/i, JSON.parse(response.body)['displayMessage'])
    end

    def test_version_since_invalid_date_format
      post :version, params: { id: @library_view_version.id, since: 'invalid-date' }
      assert_response :bad_request
      assert_match(/date format is incorrect/i, JSON.parse(response.body)['displayMessage'])
    end

    def test_version_since_finds_correct_history
      old_export = create_export_history(@library_view_version, "test-server", 2.weeks.ago)
      recent_export = create_export_history(@library_view_version, "test-server", 3.days.ago)

      since_date = 1.week.ago.iso8601

      @controller.expects(:async_task).with do |action_class, options|
        assert_equal Actions::Katello::ContentViewVersion::Export, action_class
        assert_equal old_export.id, options[:from_history].id
        assert_equal @library_view_version, options[:content_view_version]
        true
      end.returns(build_task_stub)

      post :version, params: { id: @library_view_version.id, since: since_date }
      assert_response :accepted
    end

    def test_version_since_no_history_before_date
      create_export_history(@library_view_version, "test-server", 1.week.ago)

      since_date = 1.month.ago.iso8601

      post :version, params: { id: @library_view_version.id, since: since_date }
      assert_response :not_found
      assert_match(/no existing export history.*before.*full export/i, JSON.parse(response.body)['displayMessage'])
    end

    def test_version_since_respects_destination_server
      create_export_history(@library_view_version, "test-server", 1.week.ago)
      other_server_export = create_export_history(@library_view_version, "other-server", 1.week.ago)

      since_date = 3.days.ago.iso8601

      post :version, params: { id: @library_view_version.id, since: since_date, destination_server: "other-server" }
      assert_response :not_found
    end

    def test_version_since_with_destination_server_and_async_task
      test_server_export = create_export_history(@library_view_version, "test-server", 1.week.ago)

      since_date = 1.week.ago.iso8601
      dest_server = "test-server"

      @controller.expects(:async_task).with do |action_class, options|
        assert_equal Actions::Katello::ContentViewVersion::Export, action_class
        assert_equal test_server_export.id, options[:from_history].id
        assert_equal dest_server, options[:destination_server]
        true
      end.returns(build_task_stub)

      post :version, params: { id: @library_view_version.id, since: since_date, destination_server: dest_server }
      assert_response :accepted
    end

    def test_library_since_finds_correct_history
      setup_library_since_test_data

      since_date = 1.week.ago.iso8601

      @controller.expects(:async_task).with do |action_class, options|
        assert_equal ::Actions::Pulp3::Orchestration::ContentViewVersion::ExportLibrary, action_class
        assert_equal @library_old_export.id, options[:from_history].id
        assert_equal @organization, options[0]
        true
      end.returns(build_task_stub)

      post :library, params: { organization_id: @organization.id, since: since_date }
      assert_response :accepted
    end

    def test_library_since_no_history_before_date
      setup_library_since_test_data

      since_date = 1.month.ago.iso8601

      post :library, params: { organization_id: @organization.id, since: since_date }
      assert_response :not_found
      assert_match(/no existing export history.*before.*full export/i, JSON.parse(response.body)['displayMessage'])
    end

    def test_library_since_respects_destination_server
      setup_library_since_test_data
      other_server_export = create_export_history(@library_version, "other-server", 1.week.ago, { format: "importable", incremental: false })

      since_date = 3.days.ago.iso8601

      post :library, params: { organization_id: @organization.id, since: since_date, destination_server: "other-server" }
      assert_response :not_found
    end

    def test_library_since_with_destination_server_and_async_task
      setup_library_since_test_data
      test_server_export = create_export_history(@library_version, "test-server", 1.week.ago, { format: "importable", incremental: false })

      since_date = 1.week.ago.iso8601
      dest_server = "test-server"

      @controller.expects(:async_task).with do |action_class, options|
        assert_equal ::Actions::Pulp3::Orchestration::ContentViewVersion::ExportLibrary, action_class
        assert_equal test_server_export.id, options[:from_history].id
        assert_equal dest_server, options[:destination_server]
        true
      end.returns(build_task_stub)

      post :library, params: { organization_id: @organization.id, since: since_date, destination_server: dest_server }
      assert_response :accepted
    end

    def test_repository_since_finds_correct_history
      setup_repository_since_test_data

      since_date = 1.week.ago.iso8601

      @controller.expects(:async_task).with do |action_class, options|
        assert_equal ::Actions::Pulp3::Orchestration::ContentViewVersion::ExportRepository, action_class
        assert_equal @repo_old_export.id, options[:from_history].id
        assert_equal @repository, options[0]
        true
      end.returns(build_task_stub)

      post :repository, params: { id: @repository.id, since: since_date }
      assert_response :accepted
    end

    def test_repository_since_no_history_before_date
      setup_repository_since_test_data

      since_date = 1.month.ago.iso8601

      post :repository, params: { id: @repository.id, since: since_date }
      assert_response :not_found
      assert_match(/no existing export history.*before.*full export/i, JSON.parse(response.body)['displayMessage'])
    end
  end
end
