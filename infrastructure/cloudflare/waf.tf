resource "cloudflare_ruleset" "waf_custom" {
  zone_id = var.cloudflare_zone_id
  name    = "Taliabu custom WAF rules"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      ref         = "block_common_exploit_scanners"
      description = "Block common exploit scanner paths"
      expression  = <<-EOT
        lower(http.request.uri.path) contains "/.env" or
        lower(http.request.uri.path) contains "/.git" or
        lower(http.request.uri.path) contains "/wp-admin" or
        lower(http.request.uri.path) contains "/wp-login" or
        lower(http.request.uri.path) contains "/wp-" or
        lower(http.request.uri.path) contains "/wp/" or
        lower(http.request.uri.path) contains "/phpmyadmin" or
        lower(http.request.uri.path) contains "phpinfo" or
        lower(http.request.uri.path) contains "/vendor/phpunit" or
        lower(http.request.uri.path) contains "/actuator" or
        lower(http.request.uri.path) contains "/server-status" or
        lower(http.request.uri.path) contains "/nginx_status" or
        lower(http.request.uri.path) contains "/.aws" or
        lower(http.request.uri.path) contains "/.ssh" or
        lower(http.request.uri.path) contains "/.docker" or
        lower(http.request.uri.path) contains "/.config/gcloud" or
        lower(http.request.uri.path) contains "/config.php" or
        lower(http.request.uri.path) contains "/credentials" or
        lower(http.request.uri.path) contains "firebase-" or
        lower(http.request.uri.path) contains "service-account.json" or
        lower(http.request.uri.path) contains "keyfile.json" or
        lower(http.request.uri.path) contains "gcp-" or
        lower(http.request.uri.path) contains "/backup.sql" or
        lower(http.request.uri.path) contains "/database.sql" or
        lower(http.request.uri.path) contains ".sql" or
        lower(http.request.uri.path) contains ".bak"
      EOT
      action      = "block"
      enabled     = true
    },
    {
      ref         = "block_unsupported_server_extensions"
      description = "Block unsupported server-side executable extensions"
      expression  = <<-EOT
        lower(http.request.uri.path) contains ".php" or
        lower(http.request.uri.path) contains ".asp" or
        lower(http.request.uri.path) contains ".aspx" or
        lower(http.request.uri.path) contains ".jsp" or
        lower(http.request.uri.path) contains ".cgi"
      EOT
      action      = "block"
      enabled     = true
    },
  ]
}
