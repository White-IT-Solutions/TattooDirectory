# Now, your deployment process will involve passing the Git commit SHA (which was used to tag the image) to your terraform apply command.

# For example:

# The CI/CD pipeline gets the commit SHA
GIT_COMMIT_SHA=$(git rev-parse --short HEAD) # e.g., "a1b2c3d"

# The pipeline builds and pushes the image tagged with a1b2c3d

# The pipeline then runs terraform apply, passing the tag as a variable
terraform apply -var="scraper_image_tag=${GIT_COMMIT_SHA}" -auto-approve
