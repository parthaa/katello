module Katello
  class EnabledModuleStream < Katello::Model
    has_many :hosts, :through => :host_enabled_module_streams, :class_name => "::Host"
    has_many :host_enabled_module_streams, :class_name => "Katello::HostEnabledModuleStream", :dependent => :destroy, :inverse_of => :enabled_module_stream
  end
end
