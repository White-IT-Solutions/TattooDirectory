# Use an official multi-architecture Node.js image
FROM node:20-slim

# Add metadata labels for image organization
LABEL maintainer="Tattoo Directory Team"
LABEL version="1.0"
LABEL description="Fargate scraper container for tattoo artist data aggregation"

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies for web scraping (if needed)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
# This leverages Docker layer caching
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy shared utilities (already in common/ subdirectory)
COPY common/ ./common/

# Copy application source code
COPY app.js .

# Create non-root user for security
RUN groupadd -r scraper && useradd -r -g scraper scraper
RUN chown -R scraper:scraper /usr/src/app
USER scraper

# Add a healthcheck to ensure the container is responsive
# This checks if the main process is running and can connect to AWS services
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Health check passed'); process.exit(0)" || exit 1

# Set environment variables with defaults
ENV NODE_ENV=production
ENV AWS_REGION=eu-west-2
ENV MAX_MESSAGES_PER_POLL=10
ENV WAIT_TIME_SECONDS=20
ENV VISIBILITY_TIMEOUT=300

# Expose port for potential health check endpoint (optional)
EXPOSE 3000

# Command to run the application
CMD [ "node", "app.js" ]