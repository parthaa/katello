class CreateContentViewModuleStreamFilterRules < ActiveRecord::Migration[5.2]
  def change
    create_table :katello_content_view_module_stream_filter_rules do |t|
      t.references :content_view_filter, index: { name: :index_cvmsfr_cv_filter_id }
      t.references :module_stream, index: { name: :index_cvmsfr_modules_stream_id  }
    end
  end
end
