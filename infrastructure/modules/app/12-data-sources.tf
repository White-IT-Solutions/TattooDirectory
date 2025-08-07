# Data sources for looking up existing AWS resources, like managed policies.

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# AWS MANAGED IAM POLICIES
# =============================================================================

data "aws_iam_policy" "aws_xray_daemon_write_access" {
  name = "AWSXRayDaemonWriteAccess"
}

data "aws_iam_policy" "amazon_ecs_task_execution_role_policy" {
  name = "AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy" "config_role" {
  # Note: The policy name is "ConfigRole", but the path is "service-role/"
  # The data source finds it by name regardless of the path.
  arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

data "aws_iam_policy" "amazon_ssm_automation_role" {
  name = "AmazonSSMAutomationRole"
}

data "aws_iam_policy" "aws_backup_service_role_policy_for_backup" {
  # Note: The policy name is "AWSBackupServiceRolePolicyForBackup", but the path is "service-role/"
  # The data source finds it by name regardless of the path.
  arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}