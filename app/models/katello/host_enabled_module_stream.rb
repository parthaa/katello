module Katello
  class HostEnabledModuleStream < Katello::Model
    # Do not use active record callbacks in this join model.  Direct INSERTs and DELETEs are done
    belongs_to :host, :inverse_of => :host_enabled_module_streams, :class_name => '::Host::Managed'
    belongs_to :enabled_module_stream, :inverse_of => :host_enabled_module_streams, :class_name => 'Katello::EnabledModuleStream'
  end
end
