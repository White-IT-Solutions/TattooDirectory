# Development Tools

This directory contains development tools and configuration files for the Tattoo Artist Directory project.

## Structure

```
dev-tools/
├── docker/                    # Docker Compose configurations
│   ├── docker-compose.local.yml      # Base local development setup
│   ├── docker-compose.windows.yml    # Windows-specific overrides
│   ├── docker-compose.macos.yml      # macOS-specific overrides
│   ├── docker-compose.linux.yml      # Linux-specific overrides
│   └── docker-compose.override.yml   # Cross-platform development overrides
├── .env.local                # Local environment configuration
└── README.md                 # This file
```

## Usage

### Docker Compose

Run the development environment from the project root:

```bash
# Basic setup (uses docker-compose.local.yml + docker-compose.override.yml)
docker-compose -f dev-tools/docker/docker-compose.local.yml up

# Platform-specific setup
# Windows
docker-compose -f dev-tools/docker/docker-compose.local.yml -f dev-tools/docker/docker-compose.windows.yml up

# macOS
docker-compose -f dev-tools/docker/docker-compose.local.yml -f dev-tools/docker/docker-compose.macos.yml up

# Linux
docker-compose -f dev-tools/docker/docker-compose.local.yml -f dev-tools/docker/docker-compose.linux.yml up
```

### Environment Configuration

1.  Create a `.env.local` file in the `dev-tools` directory.

2.  Add the following environment variables to the file:

    ```
    # Tattoo Directory Local Environment Configuration

    # Port Configuration (customize to avoid conflicts)
    FRONTEND_PORT=3000
    BACKEND_PORT=9000
    SWAGGER_PORT=8080
    LOCALSTACK_PORT=4566
    LOCALSTACK_EXTERNAL_PORT_START=4510
    LOCALSTACK_EXTERNAL_PORT_END=4559

    # Google Maps API Key
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

    # Resource Limits (adjust based on your system)
    LOCALSTACK_MEMORY_LIMIT=1536M
    BACKEND_MEMORY_LIMIT=512M
    FRONTEND_MEMORY_LIMIT=1G
    SWAGGER_MEMORY_LIMIT=64M

    # LocalStack Configuration
    LOCALSTACK_DEBUG=1
    LOCALSTACK_PERSISTENCE=1
    LOCALSTACK_VOLUME_DIR=./localstack-data

    # Development Configuration
    NODE_ENV=development
    NEXT_TELEMETRY_DISABLED=1

    # File Watching (platform-specific, auto-detected)
    # WATCHPACK_POLLING=true    # Enable for Windows
    # CHOKIDAR_USEPOLLING=true  # Enable for Windows
    # CHOKIDAR_INTERVAL=1000    # Polling interval in ms

    # Docker Configuration
    COMPOSE_PROJECT_NAME=tattoo-directory
    COMPOSE_FILE=docker-compose.local.yml

    # Platform-specific overrides (auto-detected)
    # COMPOSE_FILE=docker-compose.local.yml:docker-compose.windows.yml  # Windows
    # COMPOSE_FILE=docker-compose.local.yml:docker-compose.macos.yml    # macOS
    # COMPOSE_FILE=docker-compose.local.yml:docker-compose.linux.yml    # Linux
    ```

3.  Customize the values in `.env.local` as needed for your system.

## Services

The Docker Compose setup includes:

- **LocalStack**: AWS services emulation (DynamoDB, OpenSearch, S3, etc.)
- **Backend**: Lambda Runtime Interface Emulator for API development
- **Frontend**: Next.js development server
- **Swagger UI**: API documentation interface
- **Data Seeder**: Test data population (optional profile)

## API Documentation

The API documentation files have been moved to `backend/docs/`:
- `backend/docs/openapi.yaml` - OpenAPI specification
- `backend/docs/swagger-ui.html` - Swagger UI interface
- `backend/docs/swagger-config.js` - Swagger UI configuration

## Platform Optimizations

Each platform-specific override file includes optimizations for:

- **Windows**: Enhanced file watching, increased timeouts, named pipe handling
- **macOS**: Delegated volume consistency, native fsevents support
- **Linux**: Standard volume mounts, faster startup times, inotify support

## Migration Notes

Files have been reorganized as follows:

- `docs/openapi.yaml` → `backend/docs/openapi.yaml`
- `docs/swagger-*.{js,html}` → `backend/docs/swagger-*.{js,html}`
- `docker-compose*.yml` → `dev-tools/docker/docker-compose*.yml`
- `.env.local.example` → `dev-tools/.env.local`
