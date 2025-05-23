module Katello
  module Pulp3
    class RepositoryMirror
      attr_accessor :repo_service

      delegate :repo, to: :repo_service
      delegate :smart_proxy, to: :repo_service

      delegate :api, to: :repo_service

      def initialize(repository_service)
        @repo_service = repository_service
      end

      def content_guard_href
        content_guard_api = ::Katello::Pulp3::Api::ContentGuard.new(smart_proxy)
        content_guard_api.list&.results&.first&.pulp_href
      end

      def backend_object_name
        #Create repos in pulp3 instance with the name as this repo's pulp_id
        repo.pulp_id
      end

      def refresh_entities
        href = remote_href
        if href
          # Do not consider remotes_uln_api, since the Katello server is not a ULN server. Even if the sync
          # to Katello used ULN, the sync from Katello server to smart proxy will use a normal RPM remote!
          [api.remotes_api.partial_update(href, remote_options)]
        else
          create_remote
          []
        end
      end

      def needs_updates?
        remote = fetch_remote
        return true if remote.blank?
        options = repo_service.compute_remote_options
        options.keys.any? { |key| remote.send(key) != options[key] }
      end

      def remote_href
        fetch_remote.try(:pulp_href)
      end

      def create_entities
        create
        create_remote unless fetch_remote
      end

      def create(_force = false)
        api.repositories_api.create(name: backend_object_name)
      end

      def update
        api.repositories_api.update(repository_href, name: backend_object_name)
      end

      def delete(href = repository_href)
        api.repositories_api.delete(href) if href
      rescue api.api_exception_class => e
        raise e if e.code != 404
        nil
      end

      def repository_href
        fetch_repository.try(:pulp_href)
      end

      def fetch_repository
        repo_service.api.list_all(name: backend_object_name).first
      end

      def version_href
        fetch_repository&.latest_version_href
      end

      def publication_href
        if repo_service.repo.content_type == "deb"
          api.publications_verbatim_api.list(:repository_version => version_href).results.first&.pulp_href
        else
          api.publications_api.list(:repository_version => version_href).results.first&.pulp_href
        end
      end

      def create_version(options = {})
        api.repository_versions_api.create(repository_href, options)
      end

      def distribution_options(path, options = {})
        ret = {
          base_path: path,
          name: "#{backend_object_name}",
        }
        ret[:content_guard] = repo.unprotected ? nil : content_guard_href
        ret[:publication] = options[:publication] if options.key? :publication
        ret[:repository_version] = options[:repository_version] if options.key? :repository_version
        ret
      end

      def remote_options
        base_options = common_remote_options
        base_options.merge!(url: remote_feed_url)
        if (type_specific_options = repo_service.try(:mirror_remote_options))
          base_options.merge!(type_specific_options)
        end
        base_options
      end

      def create_remote
        # Do not consider remotes_uln_api, since the Katello server is not a ULN server. Even if the sync
        # to Katello used ULN, the sync from Katello server to smart proxy will use a normal RPM remote!
        remote_file_data = @repo_service.api.remote_class.new(remote_options)
        api.remotes_api.create(remote_file_data)
      end

      def compute_remote_options
        repo_service.compute_remote_options(remote_options)
      end

      def fetch_remote
        api.remotes_list(name: backend_object_name).first
      end

      def sync(options = {})
        sync_params = repo_service.sync_url_params(options)
        sync_params[:remote] = remote_href
        if repo.yum?
          sync_params.delete(:skip_types) if sync_params[:skip_types]
          sync_params[:sync_policy] = 'mirror_complete'
        else
          sync_params.delete(:sync_policy)
          sync_params[:mirror] = true
        end
        repository_sync_url_data = api.repository_sync_url_class.new(sync_params)
        [api.repositories_api.sync(repository_href, repository_sync_url_data)]
      end

      def common_remote_options
        remote_options = {
          name: backend_object_name,
          total_timeout: Setting[:sync_total_timeout],
          connect_timeout: Setting[:sync_connect_timeout_v2],
          sock_connect_timeout: Setting[:sync_sock_connect_timeout],
          sock_read_timeout: Setting[:sync_sock_read_timeout],
          rate_limit: Setting[:download_rate_limit],
        }
        remote_options.merge!({download_concurrency: repo.download_concurrency}) if repo.download_concurrency
        remote_options.merge!(ssl_remote_options)
      end

      def ssl_remote_options
        ueber_cert = ::Cert::Certs.ueber_cert(repo.root.organization)
        {
          client_cert: ueber_cert[:cert],
          client_key: ueber_cert[:key],
          ca_cert: ::Cert::Certs.ca_cert,
          tls_validation: true,
        }
      end

      def remote_feed_url
        uri = ::SmartProxy.pulp_primary.pulp3_uri!
        uri.path = repo_service.partial_repo_path
        uri.to_s
      end

      def create_publication
        if (href = version_href)
          if repo_service.repo.content_type == "deb"
            publication_data = api.publication_verbatim_class.new({repository_version: href})
            api.publications_verbatim_api.create(publication_data)
          else
            publication_data = api.publication_class.new(repository_version: href)
            api.publications_api.create(publication_data)
          end
        end
      end

      def refresh_distributions(_options = {})
        path = repo_service.relative_path
        dist_params = {}
        if repo_service.repo.repository_type.pulp3_skip_publication
          dist_params[:repository_version] = version_href
          fail "could not lookup a version_href for repo #{repo_service.repo.id}" if version_href.nil?
        else
          dist_params[:publication] = publication_href
          fail "Could not lookup a publication_href for repo #{repo_service.repo.id}" if publication_href.nil?
        end

        dist_options = distribution_options(path, dist_params)
        dist_options.delete(:content_guard) if repo_service.repo.content_type == "docker"
        if (distro = repo_service.lookup_distributions(base_path: path).first) ||
          (distro = repo_service.lookup_distributions(name: "#{backend_object_name}").first)
          # update dist
          dist_options = dist_options.except(:name)
          api.distributions_api.partial_update(distro.pulp_href, dist_options)
        else
          # create dist
          distribution_data = api.distribution_class.new(dist_options)
          api.distributions_api.create(distribution_data)
        end
      end

      def count_by_pulpcore_type(service_class)
        # Currently only supports SRPMs and Docker Manifest Lists
        fail NotImplementedError unless [::Katello::Pulp3::Srpm, ::Katello::Pulp3::DockerManifestList].include?(service_class)
        count = service_class.content_api(smart_proxy).list(service_class.page_options(limit: 1, fields: ['count'], repository_version: version_href)).count
        return 0 if count.nil?
        count
      end

      def latest_content_counts
        version_pulp_href = version_href
        return unless version_pulp_href
        api.repository_versions_api.read(version_pulp_href)&.content_summary&.present
      end

      def pulp3_enabled_repo_types
        Katello::RepositoryTypeManager.enabled_repository_types.values.select do |repository_type|
          smart_proxy.pulp3_repository_type_support?(repository_type)
        end
      end

      def create_distribution(path)
        distribution_data = api.distribution_class.new(distribution_options(path))
        repo_service.distributions_api.create(distribution_data)
      end

      def repair
        data = api.repair_class.new
        fail "Could not lookup a version_href for repo #{repo_service.repo.id}" if version_href.nil?
        api.repository_versions_api.repair(version_href, data)
      end
    end
  end
end
