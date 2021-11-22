module Katello
  class CdnConfiguration < Katello::Model
    include Encryptable
    self.inheritance_column = nil
    CDN_TYPE =  'cdn'.freeze
    SATELLITE_TYPE =  'satellite'.freeze
    AIRGAPPED_TYPE = 'airgapped'.freeze

    TYPES = [CDN_TYPE, SATELLITE_TYPE, AIRGAPPED_TYPE].freeze

    belongs_to :organization, :inverse_of => :cdn_configuration

    belongs_to :ssl_ca_credential, :class_name => "Katello::ContentCredential", :inverse_of => :ssl_ca_cdn_configurations

    encrypts :password

    validates :url, presence: true, unless: :airgapped?
    validates_with Validators::KatelloUrlFormatValidator, attributes: :url, unless: :airgapped?
    validates_with Validators::KatelloLabelFormatValidator, attributes: :upstream_organization_label, if: proc { upstream_organization_label.present? }
    validate :non_redhat_configuration, if: :satellite?

    before_validation :reset_fields

    def ssl_ca
      ssl_ca_credential&.content
    end

    def cdn?
      type == CDN_TYPE
    end

    def airgapped?
      type == AIRGAPPED_TYPE
    end

    def satellite?
      type == SATELLITE_TYPE
    end

    private

    def reset_fields
      return if satellite?

      self.url = nil
      self.url = SETTINGS[:katello][:redhat_repository_url] if cdn?
      self.username = nil
      self.password = nil
      self.upstream_organization_label = nil
      self.ssl_ca_credential_id = nil
    end

    def non_redhat_configuration
      if username.blank? || password.blank? || upstream_organization_label.blank? || ssl_ca_credential_id.blank?
        errors.add(:base, _("Username, Password, Upstream Organization Label, and SSL CA Credential are required when using a non-Red Hat CDN."))
      end
    end
  end
end
