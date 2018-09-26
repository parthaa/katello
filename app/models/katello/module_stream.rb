module Katello
  class ModuleStream < Katello::Model
    include Concerns::PulpDatabaseUnit
    has_many :repository_module_streams, class_name: "Katello::RepositoryModuleStream",
      dependent: :destroy, inverse_of: :module_stream
    has_many :repositories, through: :repository_module_streams, class_name: "Katello::Repository"
    has_many :profiles, class_name: "Katello::ModuleProfile", dependent: :destroy, inverse_of: :module_stream
    has_many :artifacts, class_name: "Katello::ModuleStreamArtifact", dependent: :destroy, inverse_of: :module_stream

    scoped_search on: :name, complete_value: true
    scoped_search on: :uuid, complete_value: true
    scoped_search on: :stream, complete_value: true
    scoped_search on: :version, complete_value: true
    scoped_search on: :context, complete_value: true
    scoped_search on: :arch, complete_value: true
    scoped_search relation: :repositories, on: :name, rename: :repository, complete_value: true
    scoped_search :on => :host_id, :rename => :host,
                   :only_explicit => true,
                   :ext_method => :find_by_host_id,
                   :operators => ["="]

    CONTENT_TYPE = Pulp::ModuleStream::CONTENT_TYPE
    MODULE_STREAM_DEFAULT_CONTENT_TYPE = "modulemd_defaults".freeze

    def self.default_sort
      order(:name)
    end

    def self.repository_association_class
      RepositoryModuleStream
    end

    def update_from_json(json)
      shared_attributes = json.keys & self.class.column_names
      shared_json = json.select { |key, _v| shared_attributes.include?(key) }
      self.update_attributes!(shared_json)

      create_stream_artifacts(json['artifacts']) if json.key?('artifacts')
      create_profiles(json['profiles']) if json.key?('profiles')
    end

    def create_stream_artifacts(artifacts)
      artifacts.each do |name|
        self.artifacts.where(name: name).first_or_create!
      end
    end

    def create_profiles(profiles)
      profiles.select do |profile, rpms|
        profile = self.profiles.where(name: profile).first_or_create!
        rpms.each do |rpm|
          profile.rpms.where(name: rpm).first_or_create!
        end
      end
    end

    def self.available_for_hosts(hosts)
      where("#{table_name}.id" => ::Katello::ModuleStream.joins(repositories: :content_facets).
            merge(::Katello::Host::ContentFacet.where(host_id: hosts)).select("#{table_name}.id"))
    end

    def self.name_stream_only
      select("#{table_name}.name", "#{table_name}.stream").distinct
    end

    def name_stream
      "#{name}:#{stream}"
    end

    def module_spec
      # NAME:STREAM:VERSION:CONTEXT:ARCH
      items = []
      [name, stream, version, context, arch].each do |item|
        if item
          items << item
        else
          break
        end
      end
      items.join(":")
    end

    def self.find_by_host_id(_key, operator, value)
      if operator == '='
        host_ids = value.is_a?(Array) ? value : value.split(",")
              { :conditions => self.arel_table["id"].in(self.available_for_hosts(host_ids).select(:id))}
      end
    end
  end
end
