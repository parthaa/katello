require 'katello_test_helper'

module Katello
  module Service
    module Pulp3
      module ContentViewVersion
        class MetadataMapTest < ActiveSupport::TestCase
          include Support::Actions::Fixtures

          def test_parse_metadata_pre_cp_id
            # original export metadata without cp_id on products

            metadata = File.read(File.open(Katello::Engine.root.join('test/fixtures/import-export/metadata.json')))
            metadata_hash = JSON.parse(metadata).with_indifferent_access

            map = Katello::Pulp3::ContentViewVersion::MetadataMap.new(metadata: metadata_hash)

            assert map
          end

          def test_parse_metadata_post_cp_id
            assert false
          end
        end
      end
    end
  end
end
