class EnabledModuleStreams < ActiveRecord::Migration[5.2]
  def up
    create_table :katello_enabled_module_streams do |t|
      t.string :name
      t.string :version
      t.string :context
      t.string :stream
      t.string :arch
      t.text :profiles
      t.timestamps
    end

    create_table :katello_host_enabled_module_streams do |t|
      t.references :host, :null => false, :index => true
      t.references :enabled_module_stream, :null => false, :index => false
      t.text :profiles
    end

    add_foreign_key :katello_host_enabled_module_streams, :hosts,
                    :name => :katello_hems_host_id_fk, :column => :host_id

    add_foreign_key :katello_host_enabled_module_streams, :katello_enabled_module_streams,
                    :name => :katello_hems_enabled_module_stream_id_fk, :column => :enabled_module_stream_id

    add_index :katello_host_enabled_module_streams, :enabled_module_stream_id,
              name: :index_katello_hems_enabled_module_stream_id

  end

  def down
    remove_foreign_key :katello_host_enabled_module_streams, name: :katello_hems_host_id_fk
    remove_foreign_key :katello_host_enabled_module_streams, name: :katello_hems_enabled_module_stream_id_fk

    drop_table :katello_host_enabled_module_streams
    drop_table :katello_enabled_module_streams
  end
end
