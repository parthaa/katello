require 'katello_test_helper'
module Katello
  module Service
    module Pulp3
      module ContentViewVersion
        class ImportableProductsTest < ActiveSupport::TestCase
          include Support::Actions::Fixtures

          it "Fetches the right products to auto create" do
            repo = katello_repositories(:fedora_17_x86_64)
            new_prod_1 = "New-Prod-1"
            new_prod_2 = "New-Prod-2"
            gpg_key = katello_gpg_keys(:fedora_gpg_key)

            metadata_products = [
              stub(label: new_prod_1, name: new_prod_1, description: 'fake', redhat: false, gpg_key: stub(name: gpg_key.name)),
              stub(label: new_prod_2, name: new_prod_2, description: 'fake', redhat: false, gpg_key: stub(name: gpg_key.name)),
              stub(label: repo.product.label, name: repo.product.name, redhat: false, gpg_key: nil)
            ]

            helper = Katello::Pulp3::ContentViewVersion::ImportableProducts.new(
              organization: repo.organization,
              metadata_products: metadata_products
            )
            helper.generate!

            assert_includes helper.creatable.map { |prod| prod[:product].label }, new_prod_1
            assert_includes helper.creatable.map { |prod| prod[:product].label }, new_prod_2
            refute_includes helper.creatable.map { |prod| prod[:product].label }, repo.product.label
            assert_includes helper.updatable.map { |prod| prod[:product].label }, repo.product.label
            refute_includes helper.updatable.map { |prod| prod[:product].label }, new_prod_1
            refute_nil repo.organization.gpg_keys.find_by(name: gpg_key.name)
          end
        end
      end
    end
  end
end
