# Environment Variables

## Required Variables

### Development
```bash
NODE_ENV=development
PORT=3000
LOCALSTACK_ENDPOINT=http://localhost:4566
```

### AWS Configuration
```bash
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values

3. Restart services:
   ```bash
   npm run local:restart
   ```

For more details, see [Configuration](./configuration.md).
