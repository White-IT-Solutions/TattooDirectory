# Common Issues & Troubleshooting

This document covers common issues you might encounter during development and their solutions.

## S3 Bucket Issues

### Issue: "The specified bucket does not exist"

**Symptoms:**

- `npm run setup-data` fails with S3 bucket error
- Image processing fails during setup
- Error message: "❌ Failed to fix image URLs: The specified bucket does not exist"

**Root Cause:**
The S3 bucket `tattoo-directory-images` doesn't exist in LocalStack.

**Solution:**

1. **Quick Fix - Create bucket manually:**

   ```bash
   node check-s3-bucket.js
   ```

2. **Verify LocalStack is running:**

   ```bash
   npm run local:status
   ```

3. **If LocalStack is not running:**

   ```bash
   npm run local:start
   ```

4. **Re-run setup:**
   ```bash
   npm run setup-data
   ```

**Prevention:**
The setup process should automatically create the S3 bucket. If this keeps happening, check:

- LocalStack service health: `curl http://localhost:4566/_localstack/health`
- Docker container status: `docker ps | grep localstack`

---

## Reset Command Confusion

### Issue: Unclear difference between reset commands

**Commands Explained:**

| Command                    | Purpose                  | What it does                                           | When to use                          |
| -------------------------- | ------------------------ | ------------------------------------------------------ | ------------------------------------ |
| `npm run local:reset`      | **Infrastructure Reset** | Stops containers, deletes volumes, restarts everything | Docker issues, corrupted containers  |
| `npm run reset-data:clean` | **Data Reset**           | Clears databases, keeps services running               | Testing different data, faster reset |

**Decision Tree:**

```
Are Docker containers working properly?
├── Yes → Use `npm run reset-data:clean` (faster)
└── No → Use `npm run local:reset` (full reset)
```

**Examples:**

```bash
# Quick data reset (services keep running)
npm run reset-data:clean

# Full infrastructure reset (slower but thorough)
npm run local:reset

# Other data reset options
npm run reset-data:minimal      # Minimal test data
npm run reset-data:fresh        # Full dataset
npm run reset-data:search-ready # Optimized for search testing
```

---

## DynamoDB Table Issues

### Issue: DynamoDB table not clearing with `local:reset`

**Symptoms:**

- `npm run local:reset` doesn't clear DynamoDB data
- Old data persists after reset
- Table appears to exist but with stale data

**Root Cause:**
`local:reset` only restarts Docker containers. If the DynamoDB table exists in LocalStack's persistent storage, it may not be cleared.

**Solution:**

1. **Use data-specific reset:**

   ```bash
   npm run reset-data:clean
   ```

2. **Or force full reset with volume removal:**

   ```bash
   npm run local:stop --volumes
   npm run local:start
   ```

3. **Verify table is cleared:**
   ```bash
   npm run data-status
   ```

**Prevention:**
Use the appropriate reset command for your needs:

- Data testing → `reset-data:clean`
- Infrastructure issues → `local:reset`

---

## API Proxy Issues

### Issue: Frontend can't connect to API

**Symptoms:**

- Frontend shows network errors
- API calls fail with CORS errors
- 404 errors on `/v1/artists` endpoints
- Browser console shows "NetworkError when attempting to fetch resource"
- Frontend trying to connect to port 9000 instead of 9001

**Root Cause:**
Either the API proxy is not running, or the frontend is configured to use the wrong endpoint.

**Solution:**

1. **Check frontend configuration:**
   Verify `frontend/.env.local` has:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:9001
   ```

2. **Check proxy status:**

   ```bash
   npm run local:proxy:status
   ```

3. **Start proxy if not running:**


   ```bash
   npm run local:proxy:start
   ```

4. **Verify proxy is accessible:**

   ```bash
   curl http://localhost:9001/health
   ```

5. **Test API endpoint through proxy:**

   ```bash
   curl "http://localhost:9001/v1/artists?query=test"
   ```

6. **If backend is not running, start it:**

   ```bash
   npm run local:start
   ```

7. **Restart full stack with proxy:**
   ```bash
   npm run local:start-with-proxy
   ```

**Important:** The frontend should connect to port 9001 (CORS proxy), not port 9000 (Lambda RIE). The CORS proxy handles CORS headers and forwards requests to the Lambda RIE.

---

## Image Processing Issues

### Issue: Images not uploading to S3

**Symptoms:**

- `setup-data` shows "Images processed: 808, Images uploaded: 0"
- Portfolio images not accessible
- S3 bucket exists but is empty
- Data status shows "S3: 0 objects"

**Root Cause:**
The image processor uses incremental processing by default and may skip uploading if it doesn't detect changes, even when the S3 bucket is empty.

**Solution:**

1. **Force image processing (Recommended):**

   ```bash
   npm run setup-data:force -- --images-only
   ```

2. **Alternative - Images-only with force flag:**

   ```bash
   npm run setup-data:images-only
   # If that doesn't work, use the force flag:
   npm run setup-data:force --images-only
   ```

3. **Verify images were uploaded:**

   ```bash
   npm run data-status
   # Should show "S3: 808 objects" or similar
   ```

4. **Check LocalStack S3 health (if still having issues):**
   ```bash
   curl http://localhost:4566/_aws/s3/buckets
   ```

**Prevention:**
The `setup-data` command should automatically upload images, but if you need to re-upload images after clearing S3, always use the `--force` flag to bypass incremental detection.

---

## OpenSearch Issues

### Issue: Search functionality not working

**Symptoms:**

- Artist search returns no results
- OpenSearch index errors
- Search API timeouts

**Root Cause:**

- OpenSearch service not running
- Index not created or corrupted
- Data not indexed properly

**Solution:**

1. **Check OpenSearch health:**

   ```bash
   curl http://localhost:4571/_cluster/health
   ```

2. **Check index status:**

   ```bash
   curl http://localhost:4571/artists-local/_stats
   ```

3. **Re-index data:**

   ```bash
   npm run reset-data:search-ready
   ```

4. **Verify data is indexed:**
   ```bash
   curl "http://localhost:4571/artists-local/_search?q=*"
   ```

---

## Performance Issues

### Issue: Slow startup times

**Symptoms:**

- `npm run local:start` takes >2 minutes
- Docker containers slow to start
- High CPU/memory usage

**Solutions:**

1. **Check Docker resources:**

   ```bash
   docker system df
   docker system prune -f
   ```

2. **Optimize Docker settings:**

   - Increase Docker Desktop memory allocation (8GB recommended)
   - Enable Docker Desktop's "Use the WSL 2 based engine" on Windows

3. **Use incremental setup:**

   ```bash
   npm run setup-data  # Uses incremental processing
   ```

4. **Monitor resource usage:**
   ```bash
   npm run local:monitor
   ```

---

## Port Conflicts

### Issue: Port already in use errors

**Symptoms:**

- "Port 3000 is already in use"
- "Port 4566 is already in use"
- Services fail to start

**Solution:**

1. **Check what's using the ports:**

   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :4566

   # Linux/Mac
   lsof -i :3000
   lsof -i :4566
   ```

2. **Kill conflicting processes:**

   ```bash
   # Windows (replace PID with actual process ID)
   taskkill /PID <PID> /F

   # Linux/Mac
   kill -9 <PID>
   ```

3. **Or use different ports:**
   Edit `devtools/.env.local` to change port configurations.

---

## Environment Variables

### Issue: Environment variables not loading

**Symptoms:**

- Services can't connect to each other
- Wrong endpoints being used
- Configuration errors

**Solution:**

1. **Check environment file exists:**

   ```bash
   ls -la devtools/.env.local
   ```

2. **Verify environment variables:**

   ```bash
   # In the project root
   node -e "console.log(process.env.LOCALSTACK_ENDPOINT)"
   ```

3. **Reload environment:**

   ```bash
   npm run local:restart
   ```

4. **Check sample environment:**
   ```bash
   cp devtools/.env.local.example devtools/.env.local
   ```

---

## Proxy Scripts Explained

### Script Overview

The project includes several proxy-related scripts for different purposes:

| Script                         | Purpose                   | Port | When to Use                  |
| ------------------------------ | ------------------------- | ---- | ---------------------------- |
| `scripts/api-proxy.js`         | **Main CORS proxy**       | 9001 | Production development       |
| `scripts/api-proxy-manager.js` | **Proxy process manager** | -    | Start/stop/status management |
| `scripts/simple-proxy.js`      | **Basic test proxy**      | 9003 | Simple testing/debugging     |
| `scripts/test-cors.js`         | **CORS test server**      | 9002 | CORS debugging only          |
| `scripts/fix-cors-simple.js`   | **S3 CORS utility**       | -    | Fix S3 image CORS issues     |

### Configuration Summary

**Correct Configuration:**

```bash
# Frontend should connect to CORS proxy
NEXT_PUBLIC_API_URL=http://localhost:9001

# Request flow:
Frontend (3000) → CORS Proxy (9001) → Lambda RIE (9000) → LocalStack (4566)
```

**Common Mistakes:**

```bash
# ❌ Wrong - causes CORS errors
NEXT_PUBLIC_API_URL=http://localhost:9000

# ❌ Wrong - bypasses Lambda
NEXT_PUBLIC_API_URL=http://localhost:4566
```

### Quick Fix Commands

```bash
# Check current configuration
npm run local:proxy:status

# Fix configuration and restart
npm run local:proxy:stop
npm run local:start-with-proxy

# Test API connection
curl http://localhost:9001/health
curl "http://localhost:9001/v1/artists?query=test"
```

---

## Lambda Runtime Interface Emulator (RIE) Issues

### Issue: Lambda RIE segmentation faults

**Symptoms:**

- Error: `panic: runtime error: invalid memory address or nil pointer dereference`
- Error: `[signal SIGSEGV: segmentation violation code=0x1 addr=0x30 pc=0x6ab69f]`
- Lambda RIE crashes with goroutine errors
- Backend API requests fail intermittently
- Multiple "ReserveFailed: AlreadyReserved" messages

**Root Cause:**
This is a known issue with the AWS Lambda Runtime Interface Emulator when handling concurrent requests or experiencing memory management problems. It typically occurs when:

- Multiple requests hit the Lambda simultaneously
- The Lambda container is under memory pressure
- There are race conditions in the RIE's request handling

**Solutions:**

1. **Quick Fix - Use Recovery Script (Recommended):**

   ```bash
   # Automated recovery script
   npm run fix:lambda-rie

   # Or get diagnostic information first
   npm run fix:lambda-rie:diagnose
   ```

2. **Manual Fix - Restart Backend Container:**

   ```bash
   # Restart just the backend container (Windows)
   docker-compose -f devtools/docker/docker-compose.local.yml -f devtools/docker/docker-compose.windows.yml --profile phase1 --env-file .env restart backend

   # Or restart the entire stack
   npm run local:restart
   ```

3. **Prevent Concurrent Request Issues:**

   ```bash
   # Stop any running processes that might be making concurrent requests
   npm run local:proxy:stop

   # Restart backend with fresh container
   docker-compose -f devtools/docker/docker-compose.local.yml stop backend
   docker-compose -f devtools/docker/docker-compose.local.yml up -d backend

   # Restart proxy
   npm run local:proxy:start
   ```

4. **Memory Optimization (if issue persists):**

   Edit `devtools/docker/docker-compose.local.yml` to add memory limits:

   ```yaml
   backend:
     # ... existing config
     deploy:
       resources:
         limits:
           memory: 512M
         reservations:
           memory: 256M
   ```

5. **Alternative - Use Production-like Setup:**

   If RIE continues to crash, temporarily switch to a more stable setup:

   ```bash
   # Use the simple proxy for basic testing
   npm run local:proxy:stop
   node scripts/simple-proxy.js &

   # Update frontend to use simple proxy
   # In frontend/.env.local:
   NEXT_PUBLIC_API_URL=http://localhost:9003
   ```

6. **Full Reset (if all else fails):**
   ```bash
   # Complete infrastructure reset
   npm run local:stop --volumes
   docker system prune -f
   npm run local:start
   npm run setup-data
   npm run local:proxy:start
   ```

**Prevention:**

- Avoid making rapid concurrent API requests during development
- Use the CORS proxy (port 9001) instead of direct Lambda RIE access (port 9000)
- Monitor Docker memory usage: `docker stats`
- Restart the backend container periodically during heavy development

**Debugging:**

```bash
# Check backend container logs
docker-compose -f devtools/docker/docker-compose.local.yml -f devtools/docker/docker-compose.windows.yml --profile phase1 --env-file .env logs backend

# Monitor container resource usage
docker stats

# Test if backend is responsive
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"rawPath":"/health","requestContext":{"http":{"method":"GET"}}}'
```

**Note:** This is a limitation of the AWS Lambda RIE in development environments. The issue doesn't occur in production AWS Lambda, so your deployed application won't experience these crashes.

---

## Getting Help

### Health Check Commands

```bash
# Overall system health
npm run health-check

# Service-specific health
npm run local:health

# Data status
npm run data-status

# Comprehensive monitoring
npm run local:monitor
```

### Log Commands

```bash
# View all logs
npm run local:logs

# Service-specific logs
npm run local:logs:backend
npm run local:logs:frontend
npm run local:logs:localstack

# Live log monitoring
npm run local:logs:viewer
```

### Debug Commands

```bash
# Platform information
npm run local:platform-info

# Docker information
npm run local:docker-info

# Service status
npm run local:status
```

---

## Quick Recovery Steps

If you're experiencing multiple issues, try this recovery sequence:

1. **Full reset:**

   ```bash
   npm run local:stop --volumes
   npm run local:start
   ```

2. **Setup data:**

   ```bash
   npm run setup-data:force
   ```

3. **Start proxy:**

   ```bash
   npm run local:proxy:start
   ```

4. **Verify everything works:**
   ```bash
   npm run health-check
   npm run data-status
   ```

This should resolve most common issues and get you back to a working state.
