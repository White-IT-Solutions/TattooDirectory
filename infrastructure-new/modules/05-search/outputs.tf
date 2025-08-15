# =============================================================================
# SEARCH MODULE OUTPUTS
# =============================================================================

# =============================================================================
# OPENSEARCH DOMAIN
# =============================================================================

output "domain_id" {
  description = "ID of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_id
}

output "domain_arn" {
  description = "ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.main.arn
}

output "domain_name" {
  description = "Name of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_name
}

output "domain_endpoint" {
  description = "Domain-specific endpoint used to submit index, search, and data upload requests"
  value       = aws_opensearch_domain.main.endpoint
}

output "kibana_endpoint" {
  description = "Domain-specific endpoint for Kibana without https scheme (deprecated, use dashboard_endpoint)"
  value       = aws_opensearch_domain.main.dashboard_endpoint
}

output "dashboard_endpoint" {
  description = "Domain-specific endpoint for OpenSearch Dashboards without https scheme"
  value       = aws_opensearch_domain.main.dashboard_endpoint
}

# =============================================================================
# CLOUDWATCH LOG GROUPS
# =============================================================================

output "audit_log_group_name" {
  description = "Name of the OpenSearch audit log group"
  value       = aws_cloudwatch_log_group.opensearch_audit.name
}

output "audit_log_group_arn" {
  description = "ARN of the OpenSearch audit log group"
  value       = aws_cloudwatch_log_group.opensearch_audit.arn
}

output "slow_search_log_group_name" {
  description = "Name of the OpenSearch slow search log group"
  value       = aws_cloudwatch_log_group.opensearch_slow_search.name
}

output "slow_search_log_group_arn" {
  description = "ARN of the OpenSearch slow search log group"
  value       = aws_cloudwatch_log_group.opensearch_slow_search.arn
}

output "slow_index_log_group_name" {
  description = "Name of the OpenSearch slow index log group"
  value       = aws_cloudwatch_log_group.opensearch_slow_index.name
}

output "slow_index_log_group_arn" {
  description = "ARN of the OpenSearch slow index log group"
  value       = aws_cloudwatch_log_group.opensearch_slow_index.arn
}

# =============================================================================
# CONFIGURATION
# =============================================================================

output "master_user_name" {
  description = "Master user name for OpenSearch"
  value       = "admin"
}

output "engine_version" {
  description = "OpenSearch engine version"
  value       = aws_opensearch_domain.main.engine_version
}