module Katello
  module Pulp3
    module ContentViewVersion
      class ImportableRepositories
        attr_reader :creatable, :updatable

        def initialize(organization:, metadata_repositories:, redhat: false)
          @organization = organization
          @metadata_repositories = metadata_repositories
          @creatable = []
          @updatable = []
          @redhat = redhat
        end

        def product_content_by_label(content_label)
          ::Katello::Content.find_by_label(content_label)
        end

        def repositories_in_library
          return @repositories_in_library unless @repositories_in_library.blank?
          repo_type = @redhat ? :redhat : :custom
          # fetch a list of [product, repo] pairs for every non-redhat library repo
          product_repos_in_library = Import.repositories_in_library(@organization).send(repo_type).
                                      pluck("#{Katello::Product.table_name}.label",
                                            "#{Katello::RootRepository.table_name}.label")
          @repositories_in_library = product_repos_in_library.compact.uniq
        end

        def generate!
          # For Red Hat repositories or Custom Repositories in the metadata exclusively
          # Set up a 2 different list of importable root repositories
          # creatable: repos that are part of the metadata but not in the library.
          #         They are ready to be created
          # updatable: repo that are both in the metadata and library.
          #         These may contain updates to the repo and hence ready to be updated.
          @metadata_repositories.each do |repo|
            next if @redhat != repo.redhat

            # why doesn't this check against repositories_in_library?
            product = Katello::Product.in_org(@organization).find_by(label: repo.product.label)
            fail _("Unable to find product '%s' in organization '%s'" % [repo.product.label, @organization.name]) if product.blank?

            if repositories_in_library.include?([repo.product.label, repo.label])
              root = ::Katello::RootRepository.find_by(product: product, label: repo.label)
              updatable << { repository: root, options: update_repo_params(repo) }
            elsif @redhat
              content = repo.content
              product_content = product_content_by_label(content.label)
              substitutions = {
                basearch: repo.arch,
                releasever: repo.minor
              }
              creatable << { product: product, content: product_content, substitutions: substitutions }
            else
              creatable << { repository: product.add_repo(create_repo_params(repo)) }
            end
          end
        end

        private

        def create_repo_params(metadata_repo)
          keys = [
            :name,
            :label,
            :description,
            :arch,
            :unprotected,
            :content_type,
            :checksum_type,
            :os_versions,
            :major,
            :minor,
            :download_policy,
            :mirroring_policy
          ]

          params = {}

          keys.each do |key|
            params[key] = metadata_repo.send(key)
          end

          params
        end

        def update_repo_params(metadata_repo)
          # TODO: handle GPG key
          keys = [
            :description,
            :arch,
            :unprotected,
            :checksum_type,
            :os_versions,
            :major,
            :minor,
            :download_policy,
            :mirroring_policy
          ]

          params = {}

          keys.each do |key|
            value = metadata_repo.send(key)
            params[key] = value if value
          end

          params
        end
      end
    end
  end
end
