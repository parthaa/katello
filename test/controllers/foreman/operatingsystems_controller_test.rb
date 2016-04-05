require 'katello_test_helper'

class OperatingsystemsControllerTest < ActionController::TestCase
  def models
    @library = katello_environments(:library)
    @library_view = katello_content_views(:library_view)
    @repo_with_dist = katello_repositories(:fedora_17_library_library_view)
    @x86_64 = architectures(:x86_64)
    @sparc = architectures(:sparc)

    @redhat = operatingsystems(:redhat)

    @repo_with_dist.distribution_bootable = true
    @repo_with_dist.distribution_arch = @x86_64.name
    @repo_with_dist.unprotected = true
    @repo_with_dist.distribution_version = @redhat.release
    @repo_with_dist.save!
    @capsule = SmartProxy.create!(:name => "foobar", :url => "http://capsule.com/")
  end

  def setup
    setup_controller_defaults(false)
    setup_foreman_routes
    login_user(User.find(users(:admin)))
    models
  end

  def test_available_kickstart_repositories
    response = get :available_kickstart_repositories, :content_view_id => @library_view.id, :lifecycle_environment_id => @library.id,
        :architecture_id => @x86_64.id, :id => @redhat.id, :content_source_id => @capsule.id
    body = JSON.parse(response.body)

    assert_response :success
    assert body[0]['path'].ends_with?(@repo_with_dist.relative_path)
    assert_includes body[0]['path'], @capsule.url
  end

  def test_nonavailable_kickstart_repositories
    response = get :available_kickstart_repositories, :content_view_id => @library_view.id, :lifecycle_environment_id => @library.id,
        :architecture_id => @sparc.id, :id => @redhat.id, :content_source_id => @capsule.id

    assert_response :success
    assert_equal '[]', response.body
  end

  def test_multiple_available_kickstart_repositories
    @redhat.expects(:kickstart_repos).returns([{ :name => "foo"}, {:name => "bar"}])
    Operatingsystem.expects(:find).returns(@redhat)

    response = get :available_kickstart_repositories, :content_view_id => @library_view.id, :lifecycle_environment_id => @library.id,
        :architecture_id => @x86_64.id, :id => @redhat.id, :content_source_id => @capsule.id

    body = JSON.parse(response.body)
    assert_response :success
    assert_equal 2, body.size
  end
end
