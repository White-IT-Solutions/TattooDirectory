# Image Display Issues - Troubleshooting Guide

## Problem Description

Images not showing up on the frontend after running `npm run seed-scenario:full-dataset`.

## Root Causes Identified

### 1. OpenSearch Mapping Conflict
**Error**: `mapper_parsing_exception: object mapping for [portfolioImages] tried to parse field [null] as object, but found a concrete value`

**Cause**: The `portfolioImages` field structure changed from simple strings to objects with `{url, description, style}`, but OpenSearch still had the old mapping.

### 2. CORS/Network Connectivity Issues
**Error**: `Cross-Origin Request Blocked` and `NetworkError when attempting to fetch resource`

**Cause**: Frontend was trying to connect directly to the Lambda container instead of using the API proxy.

## Solutions

### Quick Fix (Recommended)
```bash
# Run the comprehensive fix script
npm run fix:images

# Test the fix
npm run test:images-fix
```

### Manual Fix Steps

#### Step 1: Fix OpenSearch Mapping
```bash
# Delete and recreate index with correct mapping
npm run fix:opensearch-mapping
```

#### Step 2: Update Frontend API Configuration
The frontend `.env.local` has been updated to use the API proxy:
```bash
# OLD (Direct Lambda - causes CORS issues)
NEXT_PUBLIC_API_URL=http://localhost:9000/2015-03-31/functions/function/invocations

# NEW (API Proxy - handles CORS)
NEXT_PUBLIC_API_URL=http://localhost:9001
NEXT_PUBLIC_API_URL=http://localhost:9001
```

#### Step 3: Clean and Reseed Data
```bash
# Clean existing data
npm run reset-data:clean

# Seed with correct structure
npm run seed-scenario:full-dataset
```

#### Step 4: Start API Proxy
```bash
# Start the API proxy for CORS handling
npm run local:proxy:start

# Check proxy status
npm run local:proxy:status
```

## Data Structure Changes

### Old portfolioImages Structure
```json
{
  "portfolioImages": [
    "http://example.com/image1.jpg",
    "http://example.com/image2.jpg"
  ]
}
```

### New portfolioImages Structure
```json
{
  "portfolioImages": [
    {
      "url": "http://localhost:4566/tattoo-images/styles/traditional/tattoo_1.png",
      "description": "Traditional style tattoo featuring bold lines and classic imagery",
      "style": "traditional"
    },
    {
      "url": "http://localhost:4566/tattoo-images/styles/realism/tattoo_2.png", 
      "description": "Realistic portrait tattoo with fine detail work",
      "style": "realism"
    }
  ]
}
```

## OpenSearch Mapping Configuration

### Correct Mapping for portfolioImages
```json
{
  "portfolioImages": {
    "type": "nested",
    "properties": {
      "url": { "type": "keyword" },
      "description": { "type": "text" },
      "style": { "type": "keyword" }
    }
  }
}
```

## Verification Steps

### 1. Check Services Status
```bash
# Check all services
npm run local:status

# Check API proxy specifically
npm run local:proxy:status
```

### 2. Test API Connectivity
```bash
# Test the fix
npm run test:images-fix

# Manual API test
curl http://localhost:9001/v1/artists?limit=1
```

### 3. Verify OpenSearch Mapping
```bash
# Check mapping directly
curl -H "Host: tattoo-directory-local.eu-west-2.opensearch.localstack" \
     http://localhost:4566/artists-local/_mapping
```

### 4. Frontend Testing
1. Open http://localhost:3000
2. Navigate to any artist profile
3. Verify images are loading
4. Check browser console for errors

## Common Issues and Solutions

### Issue: API Proxy Not Running
**Symptoms**: CORS errors, network failures
**Solution**: 
```bash
npm run local:proxy:start
```

### Issue: OpenSearch Index Doesn't Exist
**Symptoms**: 404 errors when querying artists
**Solution**:
```bash
npm run fix:opensearch-mapping
npm run seed-scenario:full-dataset
```

### Issue: Images Still Not Loading
**Symptoms**: Empty portfolio sections
**Solution**:
```bash
# Full reset and fix
npm run local:clean
npm run local:start
npm run fix:images
```

### Issue: LocalStack Not Running
**Symptoms**: Connection refused errors
**Solution**:
```bash
npm run local:restart
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Next.js application |
| API Proxy | http://localhost:9001 | CORS-enabled API access |
| Backend (Direct) | http://localhost:9000 | Lambda container (direct) |
| LocalStack | http://localhost:4566 | AWS services emulation |
| OpenSearch | http://localhost:4566 | Search and indexing |

## Performance Expectations

After the fix:
- API responses: <300ms (previously 6+ seconds)
- Image loading: Immediate (with proper URLs)
- No CORS errors in browser console
- No React hydration errors

## Files Modified

### Configuration Files
- `frontend/.env.local` - Updated API URL to use proxy
- `package.json` - Added fix commands

### New Scripts
- `scripts/fix-images-issue.js` - Comprehensive fix script
- `scripts/fix-portfolio-images-mapping.js` - OpenSearch mapping fix
- `scripts/test-images-fix.js` - Verification script

### Frontend Components
- `frontend/src/app/artists/[id]/components/ClientEmptyPortfolio.jsx` - Fixed React client component issue
- `frontend/src/app/artists/[id]/page.jsx` - Updated to use client wrapper

## Prevention

To prevent similar issues in the future:

1. **Always run mapping fixes after data structure changes**
2. **Use the API proxy for local development** (avoids CORS issues)
3. **Test with `npm run test:images-fix` after changes**
4. **Keep frontend and backend data structures in sync**

## Support Commands

```bash
# Quick health check
npm run local:health

# View logs
npm run local:logs

# Monitor resources
npm run local:monitor

# Full system restart
npm run local:restart
```