# Use an official multi-architecture Node.js image
FROM node:20-slim

# Add metadata labels for image organization
LABEL maintainer="Your Name <you@example.com>"
LABEL version="1.0"

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
# This leverages Docker layer caching
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY Fargate_Scraper_Container_Logic.js .
COPY ../common/logger.js ./common/

# The user your container runs as
USER node

# Add a healthcheck to ensure the container is responsive.
# This is a simple check; a real implementation might hit an HTTP endpoint
# or check for the existence of a file.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "process.exit(0)" ]

# Command to run the application
# The wrapper.js script would typically contain logic to poll an SQS queue
# and invoke the Fargate_Scraper_Container_Logic for each message.
CMD [ "node", "Fargate_Scraper_Container_Logic.js" ]
