require 'katello_test_helper'

module ::Actions::Katello::ContentViewVersion
  class TestBase < ActiveSupport::TestCase
    include Dynflow::Testing
    include Support::Actions::Fixtures
    include Support::Actions::RemoteAction
    include FactoryBot::Syntax::Methods

    before do
      set_user
    end
  end

  class IncrementalUpdateTest < TestBase
    let(:action_class) { ::Actions::Katello::ContentViewVersion::IncrementalUpdate }
    let(:action) { create_action action_class }

    let(:library) do
      katello_environments(:library)
    end

    let(:content_view_version) do
      katello_content_view_versions(:library_view_version_2)
    end

    let(:library_repo) do
      katello_repositories(:rhel_7_x86_64)
    end

    it 'plans' do
      SmartProxy.stubs(:pulp_master).returns(SmartProxy.find_by(name: "Unused Proxy"))
      SmartProxy.any_instance.stubs(:pulp3_support?).returns(false)
      ::Actions::Katello::ContentViewVersion::IncrementalUpdate.any_instance.stubs(:pulp3_dest_base_version).returns(1)
      stub_remote_user
      @rpm = katello_rpms(:one)

      new_repo = ::Katello::Repository.new(:pulp_id => 387, :library_instance_id => library_repo.id, :root => library_repo.root)
      repository_mapping = {}
      repository_mapping[[library_repo]] = new_repo
      Dynflow::Testing::DummyPlannedAction.any_instance.stubs(:repository_mapping).returns(repository_mapping)
      Dynflow::Testing::DummyPlannedAction.any_instance.stubs(:new_puppet_environment).returns(Katello::ContentViewPuppetEnvironment)
      ::Actions::Katello::ContentViewVersion::IncrementalUpdate.any_instance.expects(:repos_to_copy).returns(repository_mapping.keys)
      task = ForemanTasks::Task::DynflowTask.create!(state: :success, result: "good")
      action.stubs(:task).returns(task)
      action.expects(:action_subject).with(content_view_version.content_view)
      plan_action(action, content_view_version, [library], :content => {:package_ids => [@rpm.id]})

      assert_action_planed_with(action, ::Actions::Pulp::Repository::CopyUnits,
                                library_repo, new_repo,
                                Katello::Rpm.with_identifiers(@rpm.id),
                                :incremental_update => true)
    end

    it 'plans for pulp 3' do
      SmartProxy.stubs(:pulp_master).returns(SmartProxy.find_by(name: "Unused Proxy"))
      SmartProxy.any_instance.stubs(:pulp3_support?).returns(true)
      ::Actions::Katello::ContentViewVersion::IncrementalUpdate.any_instance.stubs(:pulp3_dest_base_version).returns(1)
      stub_remote_user
      @rpm = katello_rpms(:one)

      new_repo = ::Katello::Repository.new(:pulp_id => 387, :library_instance_id => library_repo.id, :root => library_repo.root)
      repository_mapping = {}
      new_repo.update(content_view_version_id: ::Katello::ContentViewVersion.first.id, relative_path: "blah")
      new_repo.save!
      repository_mapping[[library_repo]] = new_repo
      Dynflow::Testing::DummyPlannedAction.any_instance.stubs(:repository_mapping).returns(repository_mapping)
      Dynflow::Testing::DummyPlannedAction.any_instance.stubs(:new_puppet_environment).returns(Katello::ContentViewPuppetEnvironment)
      ::Actions::Katello::ContentViewVersion::IncrementalUpdate.any_instance.expects(:repos_to_copy).returns(repository_mapping.keys)
      task = ForemanTasks::Task::DynflowTask.create!(state: :success, result: "good")
      action.stubs(:task).returns(task)
      action.expects(:action_subject).with(content_view_version.content_view)
      plan_action(action, content_view_version, [library], :content => {:package_ids => [@rpm.id]})

      pulp3_repo_map = {}
      pulp3_repo_map[library_repo.id] = { :dest_repo => new_repo.id, :base_version => 1 }
      assert_action_planed_with(action, ::Actions::Pulp3::Repository::MultiCopyUnits,
                                pulp3_repo_map,
                                { :errata => [], :rpms => [@rpm.id] },
                                :dependency_solving => true)
    end
  end

  class ExportTest < TestBase
    let(:action_class) { ::Actions::Katello::ContentViewVersion::Export }
    let(:action) { create_action action_class }

    let(:library) do
      katello_environments(:library)
    end

    let(:content_view_version) do
      katello_content_view_versions(:library_view_version_2)
    end

    it 'plans' do
      stub_remote_user
      export_dir = "/tmp"
      Setting['pulp_export_destination'] = export_dir
      master = smart_proxies(:one)
      SmartProxy.expects(:pulp_master!).returns(master)
      plan_action(action, content_view_version)
      # verify everything bubbles through to the export action as we expect
      assert_action_planned_with(action, ::Actions::Pulp3::ContentViewVersion::Export, content_view_version, master, export_dir)
    end
  end
end
