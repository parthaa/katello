module Katello
  class DockerAuthController < Katello::ApplicationController
    skip_before_filter :require_user, :require_org, :require_login, :session_expiry
    skip_before_filter :authorize

    before_filter  :authenticate

    def authenticate
      User.current = User.anonymous_api_admin
      @user = authenticate_with_http_basic do |u, p|
        User.try_to_login(u, p)
      end
      if @user.nil?
          request_http_basic_authentication
      end
    end

    def index
# # Use the secret and iat to create a unique key per request to prevent replay attacks
# jti_raw = [hmac_secret, iat].join(':').to_s
# jti = Digest::MD5.hexdigest(jti_raw)
# jti_payload = { :data => 'data', :iat => iat, :jti => jti }
      exp = Time.now.to_i + 4 * 3600
      payload = {:iss => "Auth Service", :aud => "Docker registry", :sub => @user.login, :access => [], :exp => exp}
      host_key = Cert::Certs.ssl_host_private_key
      token = JWT.encode(payload, host_key, 'RS256', "kid" => generate_key_id)
      render json: {:token => token, :access_token => token}
    end

    def generate_key_id
      sha = Digest::SHA256.digest(Cert::Certs.ssl_host_private_key.public_key.to_der)
      b32 = ::Base32.encode(sha).chomp("====")
      (b32.scan(/.{1,4}/))[0..11].join(":")
    end
  end
end
