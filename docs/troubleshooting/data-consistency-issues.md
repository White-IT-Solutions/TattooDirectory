# Data Consistency Issues - Troubleshooting Guide

## Quick Diagnosis

Run this command to check your current data state:

```bash
npm run data-status
```

## Common Issues and Solutions

### Issue 1: Data Count Mismatch

**Symptoms:**
- `npm run data-status` shows different counts for DynamoDB vs OpenSearch
- API returns inconsistent results
- Frontend shows different data than backend

**Example:**
```
⚠️ Artist count mismatch: DynamoDB=34, OpenSearch=150
⚠️ Studio count mismatch: DynamoDB=3, OpenSearch=53
```

**Solution:**
```bash
# Clear all data and reseed with consistent dataset
npm run reset-data:clean
npm run seed-scenario:full-dataset

# Verify fix
npm run data-status
```

**Expected Result:**
```
✅ Artist counts consistent: 150
✅ Studio counts consistent: 50
```

### Issue 2: Partial Data Loading

**Symptoms:**
- Some scenarios only partially populate databases
- DynamoDB has fewer records than expected
- OpenSearch has more documents than DynamoDB

**Root Cause:**
- Using `setup-data` with incremental processing
- Scenario seeding failed partway through
- Service synchronization issues

**Solution:**
```bash
# Use full dataset scenario instead of setup-data
npm run reset-data:clean
npm run seed-scenario:full-dataset
```

### Issue 3: Services Not Responding

**Symptoms:**
- Commands hang or timeout
- "Service unavailable" errors
- Health check failures

**Solution:**
```bash
# Restart all services
npm run local:restart

# Check service health
npm run health-check

# If still failing, full reset
npm run local:reset
npm run setup-data
```

### Issue 4: Image Accessibility Issues

**Symptoms:**
- Images not loading in frontend
- Low image accessibility percentage
- S3 upload failures

**Solution:**
```bash
# Process images only (keeps existing data)
npm run setup-data:images-only

# Or full reset if data is corrupted
npm run reset-data:clean
npm run seed-scenario:full-dataset
```

## Prevention Best Practices

### 1. Always Check Status First
```bash
npm run data-status
```

### 2. Use Consistent Commands
- ✅ `npm run seed-scenario:full-dataset` (recommended)
- ✅ `npm run reset-data:clean` (fast reset)
- ❌ Avoid mixing different scenarios without resetting

### 3. Verify After Operations
```bash
# After any data operation
npm run data-status
```

### 4. Use Appropriate Reset Commands
- **Data issues**: `npm run reset-data:clean` (keeps services running)
- **Service issues**: `npm run local:restart` (restarts services)
- **Major corruption**: `npm run local:reset` (full infrastructure reset)

## Expected Data Counts

After `seed-scenario:full-dataset`:
- **DynamoDB**: 223 items (150 artists + 50 studios + 23 styles)
- **OpenSearch**: 200 documents (150 artists + 50 studios)
- **S3**: 1000+ objects (images and assets)

## Workflow for Clean Start

Starting from completely clean state:

```bash
# 1. Ensure services are running
npm run local:start

# 2. Clear any existing data
npm run reset-data:clean

# 3. Load complete consistent dataset
npm run seed-scenario:full-dataset

# 4. Verify everything is working
npm run data-status
```

## When to Use Each Command

### Daily Development
```bash
npm run data-status              # Check current state
npm run seed-scenario:minimal    # Quick testing
npm run seed-scenario:london-artists  # Location testing
```

### Major Testing
```bash
npm run seed-scenario:full-dataset     # Complete dataset
npm run seed-scenario:performance-test # Large dataset
```

### Troubleshooting
```bash
npm run reset-data:clean         # Clear data only
npm run local:restart            # Restart services
npm run local:reset              # Full reset
```

### Image Updates
```bash
npm run setup-data:images-only   # Update images only
```

## Getting Help

If issues persist:

1. Check the full logs: `npm run local:logs`
2. Verify Docker containers: `docker ps`
3. Check LocalStack health: `curl http://localhost:4566/_localstack/health`
4. Review the data management workflow: `docs/workflows/data-management-workflow.md`

## Emergency Recovery

If everything is broken:

```bash
# Nuclear option - complete reset
npm run local:reset
npm run local:start
npm run setup-data
npm run seed-scenario:full-dataset
npm run data-status
```

This should restore a fully working environment with consistent data across all services.