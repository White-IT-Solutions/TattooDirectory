# Backend Issues Scoping Document

## Current Status: Backend Lambda Runtime Errors

### Primary Issue
The backend Lambda function is experiencing critical runtime errors that prevent proper API communication between the frontend and backend services.

## Error Categories Identified

### 1. Lambda Runtime JSON Parsing Errors
**Symptoms:**
- Continuous "Unexpected end of JSON input" errors every 15 seconds
- Lambda Runtime Interface Emulator (RIE) receiving empty/malformed payloads
- Backend logs showing JSON parsing failures at the runtime level

**Root Cause:**
- External process sending empty HTTP requests to Lambda RIE
- Health check or monitoring system hitting the Lambda with malformed JSON
- Lambda RIE expecting specific JSON format but receiving empty requests

### 2. Frontend-Backend Communication Failures
**Symptoms:**
- Frontend showing "Failed to fetch artists, falling back to mock data"
- TypeError: fetch failed in lambda-adapter.js
- API calls timing out or failing to connect

**Root Cause:**
- Backend Lambda not responding properly due to runtime errors
- CORS configuration issues
- Lambda handler crashing before processing requests

### 3. Request Context Null Reference Errors
**Symptoms:**
- "Cannot read properties of undefined (reading 'requestId')" errors
- Route handler failures when accessing event.requestContext.requestId
- Lambda function crashes during request processing

**Status:** ✅ FIXED
- Implemented getRequestId() helper function
- Replaced all instances of direct event.requestContext.requestId access
- Added null safety checks throughout the handler

### 4. Frontend Image Configuration Issues
**Symptoms:**
- Next.js Image component errors for via.placeholder.com
- OpaqueResponseBlocking errors for image resources
- Invalid src prop errors in browser console

**Status:** ✅ PARTIALLY FIXED
- Updated next.config.mjs to allow via.placeholder.com
- Created local placeholder-avatar.svg
- Updated mock data to use local placeholders

## Investigation Progress

### What We've Examined
1. **Backend Lambda Handler** (`backend/src/handlers/api-handler/index.js`)
   - Fixed null reference errors with getRequestId() helper
   - Added health endpoint (/health)
   - Improved error handling and logging

2. **Docker Configuration** (`devtools/docker/docker-compose.local.yml`)
   - Identified health check running every 15 seconds
   - Disabled problematic health check temporarily
   - Backend service running on port 9000 with Lambda RIE

3. **Frontend Configuration**
   - Lambda adapter sending requests to localhost:9000
   - Environment configured for local development
   - Temporarily disabled API calls to isolate backend issues

4. **Lambda Runtime Testing**
   - Successfully tested Lambda with manual curl requests
   - Confirmed Lambda handler processes requests correctly
   - Verified route matching and response generation works

### What We've Fixed
- ✅ Null reference errors in Lambda handler
- ✅ Added safe request ID extraction
- ✅ Improved error logging and correlation IDs
- ✅ Added health endpoint for monitoring
- ✅ Fixed Next.js image configuration issues
- ✅ Created local placeholder assets

### What's Still Broken
- ❌ Periodic JSON parsing errors (every 15 seconds)
- ❌ Frontend-backend API communication
- ❌ Unknown process sending empty requests to Lambda RIE
- ❌ Google Maps CORS issues (secondary)

## Current Hypothesis

The main issue is an external monitoring or health check process that's sending malformed requests to the Lambda RIE every 15 seconds. This process is likely:

1. **Docker health check** - Despite disabling in compose file, may still be running
2. **Node.js monitoring script** - One of the scripts in `scripts/monitoring/` directory
3. **System-level health check** - OS or container orchestration sending requests
4. **IDE or development tool** - Automated monitoring from development environment

## Next Steps (Priority Order)

### Immediate Actions (High Priority)
1. **Identify the source of periodic requests**
   - Check running Node.js processes
   - Review all monitoring scripts in `scripts/monitoring/`
   - Examine Docker container logs for health check activity
   - Monitor network traffic to port 9000

2. **Isolate Lambda RIE from external requests**
   - Change Lambda RIE port to non-standard port
   - Add request logging to identify source
   - Temporarily disable all monitoring scripts

3. **Test direct Lambda functionality**
   - Verify Lambda works with proper JSON payloads
   - Test all API endpoints manually
   - Confirm route handling and response generation

### Secondary Actions (Medium Priority)
4. **Fix frontend-backend communication**
   - Re-enable API calls once backend is stable
   - Test lambda-adapter.js with working backend
   - Verify CORS configuration

5. **Address remaining frontend issues**
   - Fix Google Maps CORS errors
   - Resolve remaining image loading issues
   - Clean up console warnings

### Long-term Actions (Low Priority)
6. **Improve monitoring and health checks**
   - Implement proper health check endpoint
   - Add structured logging for debugging
   - Set up proper development monitoring

## Files Modified During Investigation

### Backend Files
- `backend/src/handlers/api-handler/index.js` - Fixed null reference errors, added health endpoint
- `devtools/docker/docker-compose.local.yml` - Disabled health check
- `test-lambda.json` - Created for manual testing

### Frontend Files
- `frontend/next.config.mjs` - Added image domain configuration
- `frontend/src/lib/mockArtistData.js` - Updated to use local placeholders
- `frontend/public/placeholder-avatar.svg` - Created local placeholder
- `frontend/.env.local` - Temporarily disabled API calls

## Success Criteria

The backend will be considered fixed when:
1. ✅ No JSON parsing errors in Lambda RIE logs
2. ✅ Frontend can successfully fetch data from backend API
3. ✅ All API endpoints respond within 300ms
4. ✅ Health checks work without causing errors
5. ✅ No runtime crashes or null reference errors

## Risk Assessment

**High Risk:** Backend instability affects entire application functionality
**Medium Risk:** Development workflow disrupted by constant error logs
**Low Risk:** Frontend fallback to mock data provides temporary functionality

## Resources and Documentation

- Lambda RIE Documentation: AWS Lambda Runtime Interface Emulator
- Next.js Image Configuration: https://nextjs.org/docs/messages/next-image-unconfigured-host
- Backend Handler Code: `backend/src/handlers/api-handler/index.js`
- Docker Compose Config: `devtools/docker/docker-compose.local.yml`
- Frontend API Layer: `frontend/src/lib/api.js` and `frontend/src/lib/lambda-adapter.js`