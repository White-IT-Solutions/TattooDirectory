# Quick Start Guide

## 🚀 Start Development Environment

```bash
# Start everything (services + API proxy)
npm run local:start-with-proxy
```

## 🧪 Run Contract Tests

```bash
# Run contract tests (no environment variables needed)
npm run test:cli:contracts
```

## 🛑 Stop Everything

```bash
# Stop all services and proxy
npm run local:stop-all
```

## 📊 Check Status

```bash
# Check service status
npm run local:status
npm run local:proxy:status

# View logs
npm run local:logs:backend
```

## 🔧 Individual Service Management

### Core Services
```bash
npm run local:start     # Start Docker services
npm run local:stop      # Stop Docker services  
npm run local:restart   # Restart Docker services
```

### API Proxy
```bash
npm run local:proxy:start    # Start proxy
npm run local:proxy:stop     # Stop proxy
npm run local:proxy:restart  # Restart proxy
```

## 🌐 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **API Proxy** | **http://localhost:9001** | **REST API (recommended)** |
| Frontend | http://localhost:3000 | Next.js app |
| Backend | http://localhost:9000 | Lambda RIE |
| Swagger | http://localhost:8080 | API docs |
| LocalStack | http://localhost:4566 | AWS services |

## 🧪 Test API

```bash
# Health check
curl http://localhost:9001/health

# Search artists
curl "http://localhost:9001/v1/artists?query=test"
```

## 🔍 Troubleshooting

```bash
# Health check
npm run local:health

# Clean restart
npm run local:clean
npm run local:start-with-proxy

# Check logs
npm run local:logs:backend
```

---

**Need more details?** See [Local Development Guide](./local-development-guide.md)