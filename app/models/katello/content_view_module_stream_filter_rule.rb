module Katello
  class ContentViewModuleStreamFilterRule < Katello::Model
    include ::Katello::Concerns::ContentViewFilterRuleCommon
    belongs_to :filter,
               :class_name => "Katello::ContentViewModuleStreamFilter",
               :inverse_of => :module_stream_rules,
               :foreign_key => :content_view_filter_id

    validates :module_stream_id, :uniqueness => { :scope => :content_view_filter_id }
  end
end
