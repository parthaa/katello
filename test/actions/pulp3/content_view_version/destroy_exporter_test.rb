require 'katello_test_helper'

module ::Actions::Pulp3::ContentView
  class DestroyExporterTest < ActiveSupport::TestCase
    include Katello::Pulp3Support

    def setup
      @master = FactoryBot.create(:smart_proxy, :default_smart_proxy, :with_pulp3)
      @repo = katello_repositories(:fedora_17_x86_64_duplicate)
      @repo.root.update(:url => 'file:///var/lib/pulp/sync_imports/test_repos/zoo')
      @content_view = @repo.content_view
      ensure_creatable(@repo, @master)

      @repo = katello_repositories(:fedora_17_x86_64)

      ensure_creatable(@repo, @master)
    end

    def test_destroy
      ForemanTasks.sync_task(::Actions::Pulp3::Orchestration::Repository::Create, @repo, @master)
      repo_reference = Katello::Pulp3::RepositoryReference.find_by(:content_view => @content_view, :root_repository_id => @repo.root_id)
      assert repo_reference
      assert Katello::Pulp3::Api::Core.new(@master).repositories_api.read(repo_reference.repository_href)

      ForemanTasks.sync_task(::Actions::Pulp3::ContentView::DeleteRepositoryReferences, @content_view, @master)
      refute Katello::Pulp3::RepositoryReference.find_by(:id => repo_reference.id)

      assert_raises(PulpFileClient::ApiError) do
        Katello::Pulp3::Api::File.new(@master).repositories_api.read(repo_reference.repository_href)
      end
    end
  end
end
