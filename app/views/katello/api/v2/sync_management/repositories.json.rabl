collection @collection[:results]
attributes :id, :name, :description, :content_type, :url, :arch
attributes :created_at, :updated_at, :last_sync_time

node :product do |repository|
  {
    :id => repository.product.id,
    :name => repository.product.name,
    :orphaned => repository.product.orphaned?
  }
end

node :sync_status do |repository|
  repository.sync_status if repository.respond_to?(:sync_status)
end

node :permissions do |repository|
  {
    :syncable => repository.syncable_by?(User.current),
    :deletable => repository.deletable?,
    :editable => repository.editable?
  }
end