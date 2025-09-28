Container Image Compatibility
This is the primary technical requirement. A Docker image built for an x86 processor will not run on a Graviton (ARM64) processor.

Multi-Architecture Builds: The best practice is to build a multi-architecture container image. This single image manifest contains layers for both linux/amd64 (x86) and linux/arm64. When you deploy, the container runtime (Fargate, in this case) automatically pulls the correct version for its underlying architecture. This gives you maximum flexibility.
Base Image: You must ensure your Dockerfile starts from a base image that supports ARM64. Most official images (like node, python, amazonlinux) provide multi-architecture variants.
Dependencies: Your application code itself (Node.js) is architecture-agnostic. However, if any of your npm packages include native C++ add-ons (e.g., some image processing or cryptography libraries), you must ensure they provide pre-compiled binaries for ARM64 or can be compiled for ARM64 during your build process. Your current dependencies (@opensearch-project/opensearch, @aws-sdk/*) are pure JavaScript and fully compatible.

CI/CD Pipeline Adjustments
Use docker buildx: This is the recommended approach. 

buildx is a Docker CLI plugin that can build for multiple platforms simultaneously, even on an x86 build agent (using QEMU for emulation). This is the easiest way to create a multi-architecture image.
Use a Native ARM Builder: You can configure your CI/CD pipeline (e.g., in AWS CodeBuild or GitHub Actions) to use an ARM-based runner. This will build the ARM64 image natively, which is typically faster than using emulation.

This command builds for both architectures and pushes the resulting multi-arch image to your ECR repository:

docker buildx build --platform linux/amd64,linux/arm64 \
  -t ${aws_ecr_repository.scraper.repository_url}:${var.scraper_image_tag} \
  --push \
  .

✅ Best Practices & Recommendations
These suggestions will improve the maintainability and reliability of your infrastructure.
1. Manage Lambda Function Code Separately
You are currently generating a placeholder ZIP file for the Lambda function directly within Terraform using data "archive_file".
Issue: This pattern tightly couples your infrastructure definition with your application code. If a CI/CD pipeline updates the Lambda code by uploading a new ZIP file, the next terraform apply might detect that the code has changed from its placeholder content and attempt to "revert" it, leading to unpredictable deployments.
Recommendation: For a production workflow, the application code should be managed outside of this Terraform configuration. A better approach is:
Your CI/CD pipeline builds the Node.js application and uploads the ZIP file to an S3 bucket.
In your aws_lambda_function resource, you reference the object in S3 instead of a local file. This decouples the infrastructure lifecycle from the application code lifecycle.

Example:
Terraform
resource "aws_lambda_function" "api_handler" {
  # Instead of filename and source_code_hash
  # filename      = data.archive_file.api_handler_zip.output_path
  # source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  # Use S3 for the code source
  s3_bucket = "your-lambda-artifacts-bucket-name"
  s3_key    = "api-handler/v1.2.3.zip" # This key would be updated by your CI/CD pipeline
  # ...
}

✅ Best Practice Note
The use of placeholder archive_file data sources is great for initial infrastructure setup. As you move to a production-ready CI/CD pipeline, consider having your pipeline build the Lambda ZIP files, upload them to an S3 bucket, and pass the S3 key and version to Terraform. This decouples your application deployment from your infrastructure deployment.

Of course. Here is a comprehensive, step-by-step guide to setting up a secure and automated CI/CD pipeline for your AWS infrastructure using Terraform and GitHub Actions.
1. Getting Programmatic Access to AWS for Terraform & GitHub
To begin, you'll need to establish a secure connection between your AWS account, your local machine (for development), and GitHub (for automation). The most secure method for CI/CD is using OpenID Connect (OIDC), which allows GitHub Actions to assume a role in AWS without long-lived credentials. For local development, an IAM User is suitable.
For GitHub Actions (OIDC):
Create an IAM OIDC Identity Provider in AWS:
Navigate to the IAM console in your AWS account.
In the left-hand menu, select Identity providers and click Add provider.
Choose OpenID Connect.
For the Provider URL, enter https://token.actions.githubusercontent.com.
Click Get thumbprint to verify the server certificate.
For the Audience, enter sts.amazonaws.com.
Click Add provider.
Create an IAM Role for GitHub Actions:
In the IAM console, go to Roles and click Create role.
Select Web identity as the trusted entity type.
Choose the Identity provider you just created.
Select the sts.amazonaws.com Audience.
You can specify your GitHub organization, repository, or branch for more granular control.
Attach the necessary permissions policies. For initial setup, you might use AdministratorAccess, but it's a best practice to create a more restrictive, least-privilege policy later.
Give the role a descriptive name, such as GitHubActions-Terraform-Role.
Take note of the role's ARN (Amazon Resource Name), as you'll need it later.
For Local Terraform Development (IAM User):
Create an IAM User:
In the IAM console, go to Users and click Add users.
Enter a user name, such as terraform-local-dev.
Select Access key - Programmatic access as the credential type.
Attach the same permissions policies you used for the role.
Create the user and securely save the Access Key ID and Secret Access Key.
Configure AWS Credentials Locally:
Install the AWS CLI on your local machine.
Open your terminal and run the command aws configure.
When prompted, enter the Access Key ID and Secret Access Key you just saved.
Set a default AWS region (e.g., us-east-1).
Set a default output format (e.g., json).

2. Setting Up and Configuring Trussworks Bootstrap
The trussworks/bootstrap/aws Terraform module is an excellent way to create a foundational AWS account structure. It sets up an S3 bucket for storing your Terraform state and a DynamoDB table for state locking, which is crucial for preventing conflicts when multiple people or automation processes are running Terraform at the same time.
Create a new Git repository for your infrastructure code.
In the repository, create a main.tf file with the following content:
Terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Or your desired region
}

module "bootstrap" {
  source  = "trussworks/bootstrap/aws"
  version = "7.1.0" # Use the latest version

  # S3 bucket for Terraform state
  terraform_state_bucket_name = "my-unique-terraform-state-bucket-name" # MUST be globally unique

  # DynamoDB table for state locking
  terraform_state_lock_table_name = "my-terraform-state-lock"

  # IAM role for CI/CD (GitHub Actions)
  cicd_role_name = "GitHubActions-Terraform-Role" # The role you created earlier
  oidc_provider_arn = "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" # Replace ACCOUNT_ID
  github_org = "your-github-org-name"
  github_repo = "your-repo-name" # Optional: scope to a specific repo

  tags = {
    Environment = "bootstrap"
    ManagedBy   = "Terraform"
  }
}

output "terraform_state_bucket" {
  value = module.bootstrap.terraform_state_bucket_name
}

output "terraform_lock_table" {
  value = module.bootstrap.terraform_state_lock_table_name
}

output "cicd_role_arn" {
  value = module.bootstrap.cicd_role_arn
}


Initialize and Apply Terraform:
In your terminal, run terraform init.
Run terraform plan to see what resources will be created.
Run terraform apply to create the resources.
Configure Terraform Backend:
Now that you have an S3 bucket and DynamoDB table, you can configure Terraform to use them for state management. Create a backend.tf file:
Terraform
terraform {
  backend "s3" {
    bucket         = "my-unique-terraform-state-bucket-name" # The name you defined above
    key            = "global/bootstrap/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "my-terraform-state-lock"
    encrypt        = true
  }
}


Run terraform init again. Terraform will detect that you have configured a backend and will ask if you want to migrate your state. Type yes.

3. Deploying GitHub Actions as a CI/CD Tool for Terraform
Now you can set up a GitHub Actions workflow to automate your Terraform deployments. This workflow will run terraform plan on pull requests and terraform apply on merges to the main branch.
Create a .github/workflows directory in your repository.
Inside this directory, create a terraform.yml file:

YAML
name: 'Terraform CI/CD'

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  id-token: write # Required for OIDC
  contents: read
  pull-requests: write # Required for PR comments

jobs:
  terraform:
    name: 'Terraform'
    runs-on: ubuntu-latest
    env:
      AWS_REGION: "us-east-1"

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }} # Store the role ARN as a GitHub secret
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0 # Specify your Terraform version

      - name: Terraform Init
        id: init
        run: terraform init

      - name: Terraform Format
        id: fmt
        run: terraform fmt -check

      - name: Terraform Plan
        id: plan
        if: github.event_name == 'pull_request'
        run: terraform plan -no-color -input=false
        continue-on-error: true

      - name: Update PR with Plan
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        env:
          PLAN: "terraform\n${{ steps.plan.outputs.stdout }}"
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Format and Style 🖌\`${{ steps.fmt.outcome }}\`
            #### Terraform Initialization ⚙️\`${{ steps.init.outcome }}\`
            #### Terraform Plan 📖\`${{ steps.plan.outcome }}\`

            <details><summary>Show Plan</summary>

            \`\`\`\n
            ${process.env.PLAN}
            \`\`\`

            </details>

            *Pushed by: @${{ github.actor }}, Action: \`${{ github.event_name }}\`*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

      - name: Terraform Plan Status
        if: steps.plan.outcome == 'failure'
        run: exit 1

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve -input=false


Add a GitHub Secret:
In your GitHub repository, go to Settings > Secrets and variables > Actions.
Create a new repository secret named AWS_ROLE_ARN and paste the ARN of the IAM role you created earlier.

4. Deploying Digger CI/CD for GitHub Actions
Digger is an open-source tool that orchestrates Terraform runs within your existing CI/CD system. It offers features like PR-level locking and runs directly in your GitHub Actions runners, so you don't need to grant a third-party service access to your cloud environment.
Update your terraform.yml workflow to use Digger:
YAML
name: 'Digger CI'

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]
  issue_comment:
    types: [created]
    if: contains(github.event.comment.body, 'digger')
  workflow_dispatch:

permissions:
  id-token: write
  contents: write
  pull-requests: write
  statuses: write

jobs:
  digger:
    runs-on: ubuntu-latest
    steps:
      - name: Digger run
        uses: digger/digger@v0.4.6 # Use the latest version
        with:
          setup-aws: true
          aws-role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: 'us-east-1'
        env:
          GITHUB_CONTEXT: ${{ toJson(github) }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}


Create a digger.yml file in the root of your repository. This file defines your infrastructure projects and workflows.
YAML
projects:
- name: bootstrap
  dir: .
  workflow: default

workflows:
  default:
    plan:
      steps:
      - run: terraform init
      - run: terraform plan -out=plan.tfplan
    apply:
      steps:
      - run: terraform apply plan.tfplan


Now, when you open a pull request, Digger will automatically run digger plan. To apply the changes, you can comment digger apply on the pull request.

5. Integrating Infracost, Checkov, and Other Security Tools
To make your CI/CD pipeline even more robust, you can add cost estimation, security scanning, and linting as pre-deployment gates.
Update your digger.yml to include these tools in the plan workflow:
YAML
projects:
- name: bootstrap
  dir: .
  workflow: security_scan

workflows:
  security_scan:
    plan:
      steps:
      - run: terraform init
      - run: terraform plan -out=plan.tfplan
      - run: terraform show -json plan.tfplan > plan.json
      # Infracost
      - run: |
          infracost breakdown --path plan.json --format=json --out-file=infracost.json
          infracost comment github --path=infracost.json --repo=$GITHUB_REPOSITORY --pull-request=$PULL_REQUEST_NUMBER --github-token=$GITHUB_TOKEN --behavior=update
      # Checkov
      - run: checkov -f plan.json
      # tfsec
      - run: tfsec .
      # tflint
      - run: tflint --init
      - run: tflint .
    apply:
      steps:
      - run: terraform apply plan.tfplan


Since the Digger action doesn't come with these tools pre-installed, you'll need to add steps to your GitHub Actions workflow to install them. Here's an alternative terraform.yml:
YAML
# ... (on, permissions, etc.)
jobs:
  digger:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Infracost
        uses: infracost/actions/setup@v2
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}

      - name: Setup Checkov
        run: pip install checkov

      - name: Setup tfsec
        uses: aquasecurity/tfsec-action@v1.0.3

      - name: Digger run
        uses: digger/digger@v0.4.6
        with:
          # ... (same as before)


Get API Keys:
For Infracost, you'll need an API key. You can get one from the Infracost website. Add it as a GitHub secret named INFRACOST_API_KEY.

6. Deploying AWS Lambda Packages via GitHub
Finally, here's how you can build, package, and deploy an AWS Lambda function using Terraform and GitHub Actions.
Project Structure:
.
├── lambda_function/
│   ├── main.py
│   └── requirements.txt
├── main.tf
├── variables.tf
└── ...


Terraform Code (main.tf):
Terraform
# Data source to package the Lambda code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_function"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "my_lambda" {
  function_name = "my-awesome-lambda"
  handler       = "main.lambda_handler"
  runtime       = "python3.9"
  role          = aws_iam_role.lambda_exec.arn

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # ... other configurations (VPC, environment variables, etc.)
}

# IAM Role for the Lambda function
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach the basic execution role policy
resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


GitHub Actions Workflow (.github/workflows/deploy-lambda.yml):
This workflow will build the Python dependencies and then run Terraform.
YAML
name: 'Deploy Python Lambda'

on:
  push:
    branches:
      - main
    paths:
      - 'lambda_function/**' # Trigger only when Lambda code changes
      - '.github/workflows/deploy-lambda.yml'

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    name: 'Build and Deploy Lambda'
    runs-on: ubuntu-latest
    env:
      AWS_REGION: "us-east-1"

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r lambda_function/requirements.txt -t lambda_function/

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Apply
        run: terraform apply -auto-approve


Of course! Setting up a secure, multi-account deployment pipeline with GitHub Actions and OIDC is a fantastic goal. It eliminates the need to store long-lived AWS secrets in GitHub and is the modern best practice for CI/CD.
The repository you found is an excellent resource. The pattern it describes, which I'll detail below, is exactly what you need. It involves a "hub and spoke" model where GitHub Actions authenticates to a central "hub" account and is then granted permission to assume roles in your other "spoke" accounts.
Based on your providers.tf, let's designate your infra_account_id as the Hub Account and both infra_account_id and security_account_id as the Spoke Accounts (where resources are actually deployed).
Here is the step-by-step guide to configure your environment:
Step 1: Configure the Hub Account (infra_account_id)
This account is the trusted entry point for GitHub Actions.
1. Create the OIDC Identity Provider
In the AWS IAM console of your infra_account_id account, you need to create an OIDC Identity Provider. This is a one-time setup that tells AWS to trust authentication tokens from GitHub.
Provider URL: https://token.actions.githubusercontent.com
Audience: sts.amazonaws.com
2. Create the GitHubActionsRole
This is the central role that GitHub Actions will assume.
Role Name: Let's call it GitHubActionsDeployRole.
Trusted entity type: Select "Web identity" and choose the OIDC provider you just created.
Audience: sts.amazonaws.com
GitHub organization/repository: Scope this tightly for security. For example: your-org/your-repo. You can also scope it to specific branches.
The Trust Policy for this role should look like this. It allows GitHub to assume this role for actions running in the main branch of your repository.
{
	"Version": "2012-10-17",
	"Statement": [
    	{
        	"Effect": "Allow",
        	"Principal": {
            	"Federated": "arn:aws:iam::${var.infra_account_id}:oidc-provider/token.actions.githubusercontent.com"
        	},
        	"Action": "sts:AssumeRoleWithWebIdentity",
        	"Condition": {
            	"StringEquals": {
                	"token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
            	},
            	"StringLike": {
                	"token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO:ref:refs/heads/main"
            	}
        	}
    	}
	]
}

Next, attach a Permissions Policy to this GitHubActionsDeployRole. This policy's only job is to allow it to assume the AWSControlTowerExecution role in all of your target accounts.

{
	"Version": "2012-10-17",
	"Statement": [
    	{
        	"Effect": "Allow",
        	"Action": "sts:AssumeRole",
        	"Resource": [
            	"arn:aws:iam::${var.infra_account_id}:role/AWSControlTowerExecution",
            	"arn:aws:iam::${var.security_account_id}:role/AWSControlTowerExecution"
        	]
    	}
	]
}

Step 2: Configure the Spoke Accounts (infra_account_id & security_account_id)
In each of your spoke accounts, you need to update the trust policy of the AWSControlTowerExecution role. This update allows the GitHubActionsDeployRole from your hub account to assume it.
Update the Trust Policy of the AWSControlTowerExecution role in both accounts to include the following statement.
{
	"Version": "2012-10-17",
	"Statement": [
    	{
        	"Effect": "Allow",
        	"Principal": {
            	"AWS": "arn:aws:iam::${var.infra_account_id}:role/GitHubActionsDeployRole"
        	},
        	"Action": "sts:AssumeRole"
    	}
    	// ... keep any other existing trusted principals if needed
	]
}

Step 3: Configure Your GitHub Actions Workflow
Now, you can create a workflow file in your repository (e.g., .github/workflows/terraform-deploy.yml). This workflow uses the official aws-actions/configure-aws-credentials action to handle the OIDC authentication.
# .github/workflows/terraform-deploy.yml
name: 'Terraform Deploy to Dev'

on:
  push:
	branches:
  	- main # Trigger deployment on push to the main branch
  workflow_dispatch:

# These permissions are required for the OIDC connection
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
	runs-on: ubuntu-latest
    
	# Use the 'dev' environment from your repo's settings if you have one
	environment: dev

	steps:
  	- name: Checkout repository
    	uses: actions/checkout@v4

  	- name: Configure AWS Credentials
    	uses: aws-actions/configure-aws-credentials@v4
    	with:
      	# The ARN of the role in your HUB account
      	role-to-assume: arn:aws:iam::${var.infra_account_id}:role/GitHubActionsDeployRole
      	aws-region: eu-west-2 # Your primary AWS region

  	- name: Setup Terraform
    	uses: hashicorp/setup-terraform@v3
    	with:
      	terraform_version: 1.5.0

  	- name: Terraform Init
    	id: init
    	run: terraform -chdir=environments/dev init

  	- name: Terraform Plan
    	id: plan
    	run: terraform -chdir=environments/dev plan -no-color

  	- name: Terraform Apply
    	id: apply
    	# This step should only run on the main branch for safety
    	if: github.ref == 'refs/heads/main'
    	run: terraform -chdir=environments/dev apply -auto-approve


How It All Works (And Why Your providers.tf is Perfect)
You don't need to change your providers.tf file at all! Here’s the chain of events:
GitHub Actions -> Hub Account: The configure-aws-credentials action uses its OIDC token to assume the GitHubActionsDeployRole in your infra_account_id. The GitHub runner now has temporary credentials for this role.
Terraform -> Spoke Accounts: When you run terraform apply, Terraform uses the credentials from the previous step. For each provider block in your providers.tf, Terraform performs a second assume_role call to get credentials for the AWSControlTowerExecution role in the target account (infra_account_id or security_account_id).
This "role chaining" is highly secure and is exactly the pattern your providers.tf is built for. You've successfully separated the authentication concern (handled by GitHub Actions and OIDC) from the authorization concern (handled by Terraform's provider configurations).

