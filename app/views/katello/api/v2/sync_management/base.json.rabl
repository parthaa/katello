# Basic repository attributes - works with both AR objects and OpenStruct
attributes :id, :name, :content_type, :url

# Product information
node :product_id do |obj|
  obj.try(:product_id) || obj.try(:[], :product_id)
end

node :product_name do |obj|
  obj.try(:product_name) || obj.try(:[], :product_name)
end

node :redhat do |obj|
  obj.try(:redhat) || obj.try(:[], :redhat)
end

# Sync status information
node :state do |obj|
  obj.try(:state) || obj.try(:[], :state)
end

node :raw_state do |obj|
  obj.try(:raw_state) || obj.try(:[], :raw_state)
end

node :start_time do |obj|
  obj.try(:start_time) || obj.try(:[], :start_time)
end

node :finish_time do |obj|
  obj.try(:finish_time) || obj.try(:[], :finish_time)
end

node :duration do |obj|
  obj.try(:duration) || obj.try(:[], :duration)
end

node :display_size do |obj|
  obj.try(:display_size) || obj.try(:[], :display_size)
end

node :size do |obj|
  obj.try(:size) || obj.try(:[], :size)
end

node :is_running do |obj|
  obj.try(:is_running) || obj.try(:[], :is_running)
end

node :progress do |obj|
  (obj.try(:progress) || obj.try(:[], :progress)) || {}
end

node :sync_id do |obj|
  obj.try(:sync_id) || obj.try(:[], :sync_id)
end

node :error_details do |obj|
  (obj.try(:error_details) || obj.try(:[], :error_details)) || {}
end

# Repository-specific attributes for ActiveRecord objects
node :library_instance_id do |obj|
  if obj.respond_to?(:library_instance_id)
    obj.library_instance_id
  else
    obj.try(:[], :library_instance_id)
  end
end

node :backend_identifier do |obj|
  if obj.respond_to?(:backend_identifier)
    obj.backend_identifier
  else
    obj.try(:[], :backend_identifier)
  end
end

node :relative_path do |obj|
  if obj.respond_to?(:relative_path)
    obj.relative_path
  else
    obj.try(:[], :relative_path)
  end
end