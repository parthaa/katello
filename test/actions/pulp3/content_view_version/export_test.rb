require 'katello_test_helper'

module ::Actions::Pulp3::ContentView
  class ExportTest < ActiveSupport::TestCase
    include Katello::Pulp3Support

    def setup
      @smart_proxy = FactoryBot.create(:smart_proxy, :default_smart_proxy, :with_pulp3)
      @repo = katello_repositories(:fedora_17_x86_64_duplicate)
      @repo.root.update_attribute(:unprotected, true)
      create_repo(@repo, @smart_proxy)
      ForemanTasks.sync_task(::Actions::Pulp3::Orchestration::Repository::GenerateMetadata, @repo, @smart_proxy)
      @content_view = @repo.content_view
      @content_view_version = @content_view.versions.last
    end

    def teardown
      ForemanTasks.sync_task(::Actions::Pulp3::Orchestration::Repository::Delete, @repo, @smart_proxy)
    end

    def test_export
      ForemanTasks.sync_task(::Actions::Pulp3::ContentViewVersion::CreateExporter, content_view_version_id: @content_view_version.id,
                                   smart_proxy_id: @smart_proxy.id)
      binding.pry
    end
  end
end
