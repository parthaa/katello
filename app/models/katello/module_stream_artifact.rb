module Katello
  class ModuleStreamArtifact < ApplicationRecord
    belongs_to :module_stream, class_name: "Katello::ModuleStream"
    belongs_to :package, :class_name => "::Katello::Rpm"
  end
end
