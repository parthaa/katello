module Katello
  module Concerns
    module SearchByRepositoryName
      extend ActiveSupport::Concern
      include ScopedSearchExtensions

      included do
        has_many :root_repositories, through: :repositories, :source => :root, class_name: "Katello::RootRepository"
        scoped_search :relation => :root_repositories, :on => :name, :rename => :repository,
                      :complete_value => true,
                      :ext_method => :search_by_repo_name, :only_explicit => true
      end

      def self.setup_units
        repo_unit_classes = ::Katello::RepositoryTypeManager.repository_types.values.map{|t| t.content_types.map(&:model_class) }.flatten
        repo_unit_classes = repo_unit_classes.select {|klazz| klazz <= ::Katello::Concerns::PulpDatabaseUnit &&
                                                              klazz.many_repository_associations}
        repo_unit_classes.each {|klazz| klazz.send :include, SearchByRepositoryName}
      end

      module ClassMethods
        def search_by_repo_name(_key, operator, value)
          conditions = sanitize_sql_for_conditions(["#{Katello::RootRepository.table_name}.name #{operator} ?", value_to_sql(operator, value)])
          query = self.joins(:repositories => :root).where(conditions).select('id')
          {:conditions => "#{self.table_name}.id IN (#{query.to_sql})"}
        end
      end
    end
  end
end
