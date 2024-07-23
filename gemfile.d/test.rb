group :test do
  gem "vcr", "~> 6.1"
  gem 'theforeman-rubocop', '~> 0.0.6', require: false
  gem 'mocha', '~> 2.1', "<  2.4.3"
end
