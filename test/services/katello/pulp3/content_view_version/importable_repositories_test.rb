require 'katello_test_helper'

module Katello
  module Service
    module Pulp3
      module ContentViewVersion
        class ImportableRepositoriesTest < ActiveSupport::TestCase
          include Support::Actions::Fixtures

          it "Fetches the right repos to auto create" do
            repo = katello_repositories(:fedora_17_x86_64)
            new_repo_1 = "New-Repo-1"
            gpg_key = katello_gpg_keys(:fedora_gpg_key)
            product_label = repo.product.label

            metadata_product = stub(label: product_label)
            metadata_content = stub
            metadata_gpg_key = stub(name: gpg_key.name)
            metadata_repositories = [
              stub('updatable repo',
                redhat: repo.redhat?,
                gpg_key: metadata_gpg_key,
                product: metadata_product,
                content: metadata_content,
                name: repo.name,
                label: repo.label + "foo",
                description: repo.description,
                arch: repo.arch,
                unprotected: repo.unprotected,
                content_type: repo.content_type,
                checksum_type: repo.checksum_type,
                os_versions: repo.os_versions,
                major: repo.major,
                minor: repo.minor,
                download_policy: repo.download_policy,
                mirroring_policy: repo.mirroring_policy
              ),
              stub('new repo 1', label: new_repo_1, description: nil, redhat: false, product: metadata_product, content: metadata_content)
            ]

            helper = Katello::Pulp3::ContentViewVersion::ImportableRepositories.
                      new(organization: repo.organization, metadata_repositories: metadata_repositories)
            helper.generate!

            assert_includes helper.creatable.map { |r| r[:repository].label }, new_repo_1
            refute_includes helper.creatable.map { |r| r[:repository].label }, repo.label
            assert_includes helper.updatable.map { |r| r[:repository].label }, repo.label
            refute_includes helper.updatable.map { |r| r[:repository].label }, new_repo_1

            refute_nil repo.organization.gpg_keys.find_by(name: gpg_key.name)
          end

          it "Fetches the right repos to enable" do
            repo = katello_repositories(:rhel_7_no_arch)
            product_label = repo.product.label
            metadata_product = stub(label: product_label)
            metadata_content = stub(label: repo.content.label)
            metadata_repositories = [
              stub(
                name: repo.name,
                label: repo.label + "foo",
                redhat: repo.redhat?,
                product: metadata_product,
                content: metadata_content,
                description: repo.description,
                arch: repo.arch,
                major: repo.major,
                minor: repo.minor
              )
            ]

            helper = Katello::Pulp3::ContentViewVersion::ImportableRepositories.
                      new(organization: repo.organization, metadata_repositories: metadata_repositories, redhat: true)
            helper.generate!

            assert helper.creatable.size, 1
            assert_includes helper.creatable.map { |r| r[:product].label }, product_label
            assert_includes helper.creatable.map { |r| r[:content].label }, repo.content.label
            assert_includes helper.creatable.map { |r| r[:substitutions][:basearch] }, repo.arch
            assert_includes helper.creatable.map { |r| r[:substitutions][:releasever] }, repo.minor
          end
        end
      end
    end
  end
end
