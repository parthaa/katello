class AddGeneratedByExportToContentView < ActiveRecord::Migration[6.0]
  def change
    add_column :katello_content_views, :generated_by_export, :boolean, :default => false, :null => false
    ::Katello::ContentView.reset_column_information
    ::Katello::ContentView.all.each do |cv|
      next unless cv.library_export? || cv.library_import?
      cv.update!(generated_by_export: true)
    end
  end
end
