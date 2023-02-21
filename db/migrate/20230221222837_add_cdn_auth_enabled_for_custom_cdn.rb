class AddCdnAuthEnabledForCustomCdn < ActiveRecord::Migration[6.1]
  def change
    add_column :katello_cdn_configurations, :cdn_auth_enabled, :boolean, default: false
  end
end
