class AddRpmIdToArtifacts < ActiveRecord::Migration[5.1]
  class FakeModuleStreamArtifact < Katello::Model
    self.table_name = 'katello_module_stream_artifacts'
    belongs_to :package, :class_name => "::Katello::Rpm"
    belongs_to :module_stream, class_name: "Katello::ModuleStream"
  end

  def change
    add_column :katello_module_stream_artifacts, :package_id, :integer
    add_foreign_key :katello_module_stream_artifacts, :katello_rpms,
                    :name => "katello_module_stream_artifacts_rpm_fk", :column => "package_id"
    FakeModuleStreamArtifact.find_each do |artifact|
      module_rpm = Katello::Rpm.where(::Katello::Util::Package.parse_nvrea_nvre(artifact.name)).first_or_create!
      artifact.update_attributes!(:package => module_rpm)
    end

    add_index :katello_module_stream_artifacts, [:module_stream_id, :package_id],
              unique: true, name: :katello_module_stream_artifacts_package_mod_stream_id_uniq
  end
end
