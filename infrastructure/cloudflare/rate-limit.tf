resource "cloudflare_ruleset" "api_rate_limit" {
  zone_id = var.cloudflare_zone_id
  name    = "Taliabu expensive API rate limit"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [
    {
      ref         = "rate_limit_expensive_api"
      description = "Limit expensive render and Copernicus proxy requests per IP"
      expression  = <<-EOT
        http.request.uri.path eq "/api/render" or
        starts_with(http.request.uri.path, "/api/copernicus/")
      EOT
      action      = "block"
      enabled     = true
      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"]
        period              = 10
        requests_per_period = 60
        mitigation_timeout  = 10
      }
    },
  ]
}
