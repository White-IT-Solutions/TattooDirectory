# environments/prod/prod_main.tf

# Call the main application module
module "app" {
  source = "../../modules/app"

  # Pass in variables from this environment's .tfvars file
  environment                 = var.environment
  project_name                = var.project_name
  notification_email          = var.notification_email
  owner_email                 = var.owner_email
  aws_region                  = var.aws_region
  app_version                 = var.app_version
  default_data_classification = var.default_data_classification
  scraper_image_tag           = var.scraper_image_tag
  backup_retention_days       = var.backup_retention_days
  replica_aws_region          = var.replica_aws_region

  # Pass the aliased provider configurations to the module.
  providers = {
    aws.replica = aws.replica
    aws.us_east_1 = aws.us_east_1
  }
}