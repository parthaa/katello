object false

extends "katello/api/v2/common/_metadata"

child @collection[:results] => :results do
  extends "katello/api/v2/sync_management/base"
end

node :permissions do
  {
    :syncable => @collection[:permissions][:syncable],
    :can_edit => @collection[:can_edit],
    :can_create => @collection[:can_create],
    :can_delete => @collection[:can_delete]
  }
end