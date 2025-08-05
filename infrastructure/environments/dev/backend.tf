# Backend configuration for dev environment
# Uncomment and configure when ready for remote state

# terraform {
#   backend "s3" {
#     bucket         = "your-terraform-state-bucket"
#     key            = "tattoo-artist-directory/dev/terraform.tfstate"
#     region         = "eu-west-2"
#     encrypt        = true
#     dynamodb_table = "terraform-state-lock"
#   }
# }