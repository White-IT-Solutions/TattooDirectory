# =============================================================================
# DELIVERY MODULE OUTPUTS
# =============================================================================

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_oac_id" {
  description = "ID of the CloudFront Origin Access Control"
  value       = aws_cloudfront_origin_access_control.frontend.id
}

output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = var.context.domain_name != "" ? aws_route53_zone.main[0].zone_id : ""
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = var.context.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}

output "hosted_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = var.context.domain_name != "" ? aws_route53_zone.main[0].zone_id : ""
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = var.context.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
}

output "certificate_domain_validation_options" {
  description = "Domain validation options for ACM certificate"
  value       = var.context.domain_name != "" ? aws_acm_certificate.cloudfront[0].domain_validation_options : []
}
