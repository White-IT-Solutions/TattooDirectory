# =============================================================================
# VARIABLES
# =============================================================================

variable "context" {
  description = "Context object containing common configuration"
  type = object({
    name_prefix           = string
    environment           = string
    aws_region            = string
    account_id            = string
    security_account_id   = string
    audit_account_id      = string
    common_tags           = map(string)
  })
}