# Troubleshooting Guide

## Common Issues

### Services Won't Start
```bash
# Check Docker status
docker ps

# Restart services
npm run local:restart

# Check logs
npm run local:logs
```

### Data Issues
```bash
# Reset data
npm run local:reset

# Validate data
npm run validate-data
```

### Port Conflicts
If you get port conflict errors:
1. Stop all services: `npm run local:stop`
2. Check for running processes: `docker ps`
3. Clean up: `npm run local:clean`
4. Restart: `npm run local:start`

## Getting Help
1. Check logs: `npm run local:logs`
2. Run health check: `npm run local:health`
3. Review this troubleshooting guide
4. Check the [LocalStack troubleshooting](localstack/TROUBLESHOOTING_MASTER.md)
