require 'katello_test_helper'
module Katello
  module Service
    module Pulp3
      module ContentViewVersion
        class ImportTest < ActiveSupport::TestCase
          include Support::Actions::Fixtures

          it "Import correctly resets content_view_repositories from metadata" do
            cv = katello_content_views(:library_view)
            prior_repository_ids = cv.repository_ids
            repo = katello_repositories(:rhel_7_x86_64)

            metadata_product = stub('metadata_product', label: repo.product.label, name: repo.product.name)
            metadata_repositories = [
              stub('metadata repo', label: repo.label, product: metadata_product, redhat: repo.redhat?)
            ]

            Katello::Pulp3::ContentViewVersion::Import.reset_content_view_repositories_from_metadata!(
              content_view: cv,
              metadata_repositories: metadata_repositories
            )

            refute_equal prior_repository_ids, cv.repository_ids
            assert_equal cv.repository_ids, [repo.id]
          end

          it "Fetches the intersecting repos correctly" do
            org = get_organization
            repo = katello_repositories(:feedless_fedora_17_x86_64)

            metadata_product = stub('metadata_product', label: repo.product.label)
            metadata_repositories = [
              stub('library repo', label: repo.label, product: metadata_product),
              stub('non-library repo', label: "unknown-007", product: metadata_product)
            ]

            repos = Katello::Pulp3::ContentViewVersion::Import.intersecting_repos_library_and_metadata(
              organization: org,
              metadata_repositories: metadata_repositories
            )
            assert_equal [repo.id], repos.pluck(:id)
          end

          it "should fail to import  cv if label is not specified" do
            org = katello_content_views(:library_view).organization
            metadata_cv = stub(label: nil, name: 'fake', description: nil)
            exception = assert_raises(RuntimeError) do
              ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: org,
                                               metadata_content_view: metadata_cv)
            end
            assert_match(/label not provided/, exception.message)
          end

          it "should fail to import cv if import_only is false" do
            cv = katello_content_views(:library_view)
            refute cv.import_only?
            metadata_cv = stub(name: 'fake', label: cv.label, description: 'fake', generated_for: :none)
            exception = assert_raises(RuntimeError) do
              ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: cv.organization,
                                               metadata_content_view: metadata_cv)
            end
            assert_match(/foreman-rake katello:set_content_view_import_only ID=/, exception.message)
          end

          it "should create an importable content view" do
            org = katello_content_views(:library_view).organization
            label = "Export-GREAT_REPO10000"
            metadata_cv = stub(label: label, name: label, description: 'fake', generated_for: :repository_export)
            cv = ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: org,
                                               metadata_content_view: metadata_cv)
            assert_equal cv.label, label
            assert_equal cv.organization, org
            assert cv.import_only?
          end

          it "should create an importable content view for library" do
            org = katello_content_views(:library_view).organization
            metadata_cv = stub(name: ::Katello::ContentView::EXPORT_LIBRARY,
                               label: ::Katello::ContentView::EXPORT_LIBRARY,
                               generated_for: :library_export)

            cv = ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: org, metadata_content_view: metadata_cv)
            assert_equal cv.label, ::Katello::ContentView::IMPORT_LIBRARY
            assert_equal cv.organization, org
            assert cv.import_only?
            assert cv.generated_for_library_import?
          end

          it "should create an importable content view for library with no generated_for" do
            org = katello_content_views(:library_view).organization
            cv = ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: org,
                                                metadata: { name: ::Katello::ContentView::EXPORT_LIBRARY,
                                                            label: ::Katello::ContentView::EXPORT_LIBRARY})
            assert_equal cv.label, ::Katello::ContentView::IMPORT_LIBRARY
            assert_equal cv.organization, org
            assert cv.import_only?
            assert cv.generated_for_library_import?
          end

          it "should create the import name for generated content" do
            org = katello_content_views(:library_view).organization
            cv = ::Katello::Pulp3::ContentViewVersion::Import.
                    find_or_create_import_view(organization: org,
                                                metadata: { name: "Export-Repository",
                                                            label: "Export-Repository",
                                                            generated_for: :repository_export})
            assert_equal cv.label, "Import-Repository"
            assert_equal cv.organization, org
            assert cv.import_only?
            assert cv.generated_for_repository_import?
          end
        end
      end
    end
  end
end
