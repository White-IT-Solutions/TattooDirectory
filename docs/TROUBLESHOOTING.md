# Troubleshooting Guide

## Quick Diagnostics

When encountering issues, start with these diagnostic commands:

```bash
# Check overall system health
npm run health-check

# Get detailed system status
npm run data-status

# Validate data consistency
npm run validate-data

# Check Docker services
docker-compose ps
```

## Common Issues

### 🏢 Studio Data Issues

#### Problem: "Studio data not generating" or "Missing studio information"

**Symptoms:**
```
❌ Error: Studio generation failed
⚠️  Warning: No studios found in database
❌ Error: Artist-studio relationships missing
```

**Diagnosis:**
```bash
# Check studio data status
npm run studio-status

# Validate studio data
npm run validate-studios all

# Check studio generation logs
DEBUG=studio-processor npm run setup-data
```

**Solutions:**

1. **Regenerate studio data:**
   ```bash
   # Reset and regenerate studios
   npm run reset-studios
   npm run seed-studios --scenario studio-diverse --validate
   ```

2. **Check studio configuration:**
   ```bash
   # Verify studio configuration
   node -e "
   const config = require('./scripts/data-config.js');
   console.log('Studio config:', config.studio);
   console.log('Studio scenarios:', Object.keys(config.scenarios).filter(s => s.includes('studio')));
   "
   ```

3. **Manual studio validation:**
   ```bash
   # Check DynamoDB studio records
   awslocal dynamodb scan \
     --table-name tattoo-directory-local \
     --filter-expression "begins_with(PK, :pk)" \
     --expression-attribute-values '{":pk":{"S":"STUDIO#"}}' \
     --endpoint-url http://localhost:4566
   
   # Check OpenSearch studio indices
   curl "http://localhost:4566/studios-local/_search?pretty"
   ```

#### Problem: "Artist-studio relationship inconsistencies"

**Symptoms:**
```
❌ Error: Artist references non-existent studio
❌ Error: Studio doesn't list artist in artists array
⚠️  Warning: Bidirectional relationship validation failed
```

**Diagnosis:**
```bash
# Validate relationships specifically
npm run validate-studios relationships

# Check relationship consistency
npm run manage-studio-relationships validate

# Debug relationship creation
DEBUG=relationship-manager npm run setup-data
```

**Solutions:**

1. **Repair relationships:**
   ```bash
   # Repair inconsistent relationships
   npm run manage-studio-relationships repair
   
   # Rebuild relationships from scratch
   npm run manage-studio-relationships rebuild
   
   # Validate after repair
   npm run validate-studios relationships
   ```

2. **Check relationship data:**
   ```bash
   # Examine artist-studio references
   node -e "
   const fs = require('fs');
   const mockData = fs.readFileSync('frontend/src/app/data/mockArtistData.js', 'utf8');
   const artistMatch = mockData.match(/export const mockArtistData = (\[[\s\S]*?\]);/);
   if (artistMatch) {
     const artists = JSON.parse(artistMatch[1]);
     const withStudios = artists.filter(a => a.tattooStudio);
     console.log('Artists with studios:', withStudios.length, '/', artists.length);
     if (withStudios.length > 0) {
       console.log('Sample studio ref:', withStudios[0].tattooStudio);
     }
   }
   "
   ```

3. **Reset and regenerate relationships:**
   ```bash
   # Clear existing relationships
   npm run reset-studios --preserve-relationships
   
   # Regenerate with fresh relationships
   npm run seed-studios --scenario studio-diverse
   
   # Validate consistency
   npm run validate-studios all
   ```

#### Problem: "Studio images not processing" or "Studio image URLs not accessible"

**Symptoms:**
```
❌ Error: Studio image processing failed
⚠️  Warning: Studio image URLs not accessible
❌ Error: S3 upload failed for studio images
```

**Diagnosis:**
```bash
# Check studio image processing
npm run validate-studios images

# Test studio image processing directly
npm run process-studio-images --studio-id studio-001 --validate

# Check S3 studio image structure
awslocal s3 ls s3://tattoo-images/studios/ --recursive --endpoint-url http://localhost:4566
```

**Solutions:**

1. **Reprocess studio images:**
   ```bash
   # Force reprocess all studio images
   npm run process-studio-images --force --validate
   
   # Process specific studio
   npm run process-studio-images --studio-id studio-001
   ```

2. **Check studio image structure:**
   ```bash
   # Verify studio image directories
   ls -la tests/Test_Data/StudioImages/
   
   # Check studio image manifest
   cat tests/Test_Data/StudioImages/image-test-manifest.json
   ```

3. **Manual studio image upload:**
   ```bash
   # Test manual studio image upload
   awslocal s3 cp tests/Test_Data/StudioImages/exterior-1.jpg \
     s3://tattoo-images/studios/studio-001/exterior-1.webp \
     --endpoint-url http://localhost:4566
   
   # Test image accessibility
   curl -I http://localhost:4566/tattoo-images/studios/studio-001/exterior-1.webp
   ```

#### Problem: "Studio mock data not generating for frontend"

**Symptoms:**
```
❌ Error: mockStudioData.js not found
⚠️  Warning: Frontend studio mock data missing
❌ Error: Studio data not available in frontend
```

**Diagnosis:**
```bash
# Check if studio mock data file exists
ls -la frontend/src/app/data/mockStudioData.js

# Validate studio mock data content
head -20 frontend/src/app/data/mockStudioData.js

# Check frontend sync for studios
DEBUG=frontend-sync npm run setup-data:frontend-only
```

**Solutions:**

1. **Regenerate studio mock data:**
   ```bash
   # Force regenerate frontend studio data
   npm run setup-data:frontend-only --validate
   
   # Check studio mock data generation
   npm run validate-studios frontend
   ```

2. **Manual studio mock data generation:**
   ```bash
   # Generate studio mock data directly
   cd scripts
   node frontend-sync-processor.js generate-studios --count 5
   
   # Validate generated studio data
   node frontend-sync-processor.js validate-studios
   ```

3. **Check studio mock data structure:**
   ```bash
   # Verify studio mock data format
   node -e "
   try {
     const studioData = require('./frontend/src/app/data/mockStudioData.js');
     console.log('Studio count:', studioData.mockStudios?.length || 0);
     console.log('Sample studio:', studioData.mockStudios?.[0] || 'None');
   } catch(e) {
     console.log('Studio mock data error:', e.message);
   }
   "
   ```

#### Problem: "Studio CLI commands not working"

**Symptoms:**
```
❌ Error: Unknown command: seed-studios
❌ Error: Studio validation failed
⚠️  Warning: Studio commands not available
```

**Diagnosis:**
```bash
# Check available studio commands
npm run data-cli help | grep studio

# Test studio CLI directly
node scripts/data-cli.js studio-status

# Check studio command implementation
grep -r "seed-studios" package.json scripts/
```

**Solutions:**

1. **Verify studio CLI installation:**
   ```bash
   # Check package.json scripts
   grep -A 5 -B 5 "studio" package.json
   
   # Test data CLI directly
   node scripts/data-cli.js --help
   ```

2. **Update CLI commands:**
   ```bash
   # Reinstall dependencies
   npm install
   
   # Test studio commands
   npm run seed-studios --help
   npm run validate-studios --help
   ```

3. **Manual studio CLI testing:**
   ```bash
   # Test individual studio operations
   cd scripts
   node data-cli.js seed-studios --scenario minimal
   node data-cli.js validate-studios data
   node data-cli.js studio-status
   ```

### 🚨 LocalStack Connection Issues

#### Problem: "LocalStack services not available"

**Symptoms:**
```
❌ Error: LocalStack services not available
   DynamoDB: Connection refused (localhost:4566)
   OpenSearch: Connection refused (localhost:4566)
   S3: Connection refused (localhost:4566)
```

**Diagnosis:**
```bash
# Check if LocalStack container is running
docker-compose ps localstack

# Check LocalStack logs
docker-compose logs localstack

# Test direct connection
curl http://localhost:4566/health
```

**Solutions:**

1. **Start LocalStack:**
   ```bash
   docker-compose up -d localstack
   
   # Wait for services to initialize (30-60 seconds)
   npm run health-check
   ```

2. **Restart LocalStack:**
   ```bash
   docker-compose restart localstack
   
   # Wait for full initialization
   sleep 30
   npm run health-check
   ```

3. **Reset LocalStack:**
   ```bash
   docker-compose down localstack
   docker-compose up -d localstack
   
   # Reinitialize data
   npm run setup-data
   ```

4. **Check Docker Desktop:**
   - Ensure Docker Desktop is running
   - Verify WSL 2 backend is enabled (Windows)
   - Check resource allocation (4GB+ RAM recommended)

#### Problem: "Connection timeout" or "Service unavailable"

**Symptoms:**
```
⚠️  Warning: Service connection timeout
   Retrying connection to DynamoDB...
   Attempt 3/5 failed
```

**Solutions:**

1. **Increase timeout values:**
   ```bash
   # Set longer timeouts for slow systems
   TIMEOUT_MS=30000 npm run setup-data
   ```

2. **Check system resources:**
   ```bash
   # Monitor Docker resource usage
   docker stats
   
   # Check available memory
   free -h  # Linux
   wmic OS get TotalVisibleMemorySize,FreePhysicalMemory  # Windows
   ```

3. **Optimize Docker settings:**
   - Increase Docker memory allocation to 4GB+
   - Use SSD storage for Docker volumes
   - Enable Docker BuildKit for better performance

### 🗄️ Database Issues

#### Problem: "DynamoDB table not found" or "OpenSearch index missing"

**Symptoms:**
```
❌ Error: Table 'tattoo-directory-local' not found
❌ Error: Index 'artists-local' does not exist
```

**Diagnosis:**
```bash
# Check LocalStack DynamoDB tables
awslocal dynamodb list-tables --endpoint-url http://localhost:4566

# Check OpenSearch indices
curl "http://localhost:4566/_cat/indices?v"
```

**Solutions:**

1. **Reinitialize services:**
   ```bash
   npm run reset-data:clean
   npm run setup-data
   ```

2. **Manual table creation:**
   ```bash
   # Create DynamoDB table manually
   awslocal dynamodb create-table \
     --table-name tattoo-directory-local \
     --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
     --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
     --billing-mode PAY_PER_REQUEST \
     --endpoint-url http://localhost:4566
   ```

3. **Check LocalStack initialization:**
   ```bash
   # Verify LocalStack init scripts ran
   docker-compose logs localstack | grep "init"
   
   # Re-run initialization if needed
   docker-compose restart localstack
   ```

#### Problem: "Data seeding fails" or "Partial data in databases"

**Symptoms:**
```
⚠️  Warning: Seeding completed with errors
   DynamoDB: 7/10 records inserted
   OpenSearch: 5/10 documents indexed
```

**Diagnosis:**
```bash
# Check detailed seeding logs
DEBUG=data-seeder npm run setup-data

# Validate data consistency
npm run validate-data:consistency
```

**Solutions:**

1. **Reset and retry:**
   ```bash
   npm run reset-data:clean
   npm run setup-data:force
   ```

2. **Check data files:**
   ```bash
   # Verify test data files exist and are valid
   ls -la scripts/test-data/
   node -e "console.log(JSON.parse(require('fs').readFileSync('scripts/test-data/artists.json')))"
   ```

3. **Manual data validation:**
   ```bash
   # Check DynamoDB records
   awslocal dynamodb scan --table-name tattoo-directory-local --endpoint-url http://localhost:4566
   
   # Check OpenSearch documents
   curl "http://localhost:4566/artists-local/_search?pretty"
   ```

### 🖼️ Image Processing Issues

#### Problem: "Image upload failed" or "S3 bucket not accessible"

**Symptoms:**
```
❌ Error: Failed to upload image to S3
   Bucket: tattoo-directory-images
   Key: styles/traditional/tattoo_1.png
```

**Diagnosis:**
```bash
# Check S3 bucket exists
awslocal s3 ls --endpoint-url http://localhost:4566

# Check bucket contents
awslocal s3 ls s3://tattoo-directory-images --endpoint-url http://localhost:4566

# Test direct S3 access
curl http://localhost:4566/tattoo-directory-images
```

**Solutions:**

1. **Recreate S3 bucket:**
   ```bash
   # Delete and recreate bucket
   awslocal s3 rb s3://tattoo-directory-images --force --endpoint-url http://localhost:4566
   awslocal s3 mb s3://tattoo-directory-images --endpoint-url http://localhost:4566
   
   # Reprocess images
   npm run setup-data:images-only
   ```

2. **Check image files:**
   ```bash
   # Verify source images exist
   ls -la tests/Test_Data/ImageSet/
   
   # Check file permissions
   find tests/Test_Data/ImageSet/ -type f -name "*.png" -o -name "*.jpg"
   ```

3. **Manual image upload test:**
   ```bash
   # Test single image upload
   awslocal s3 cp tests/Test_Data/ImageSet/traditional/tattoo_1.png \
     s3://tattoo-directory-images/test-image.png \
     --endpoint-url http://localhost:4566
   ```

#### Problem: "Image URLs not accessible" or "Images not loading in frontend"

**Symptoms:**
```
⚠️  Warning: Image URL validation failed
   Failed URLs: 15/45 images
   Example: http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_1.png
```

**Diagnosis:**
```bash
# Test image URL accessibility
curl -I http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_1.png

# Check CORS configuration
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:4566/tattoo-directory-images/styles/traditional/tattoo_1.png
```

**Solutions:**

1. **Reconfigure S3 CORS:**
   ```bash
   # Reset S3 configuration
   npm run setup-data:images-only
   
   # Validate CORS settings
   awslocal s3api get-bucket-cors --bucket tattoo-directory-images --endpoint-url http://localhost:4566
   ```

2. **Check frontend configuration:**
   ```bash
   # Verify frontend is using correct image URLs
   grep -r "localhost:4566" frontend/src/
   
   # Check mock data file
   cat frontend/src/app/data/mockArtistData.js | grep "http://localhost:4566"
   ```

### 🎨 Frontend Issues

#### Problem: "Frontend mock data not updating" or "Stale data in frontend"

**Symptoms:**
- Frontend displays old artist data
- Mock data file not reflecting recent changes
- Frontend shows placeholder data instead of enhanced business data
- Missing business data (ratings, pricing, availability)
- Missing studio relationships or contact information

**Diagnosis:**
```bash
# Check mock data file timestamp
ls -la frontend/src/app/data/mockArtistData.js

# Verify enhanced mock data content
head -20 frontend/src/app/data/mockArtistData.js

# Check for business data fields
grep -E "(rating|pricing|availability|experience)" frontend/src/app/data/mockArtistData.js

# Check frontend sync logs with enhanced processor
DEBUG=frontend-sync npm run setup-data:frontend-only

# Validate enhanced data structure
npm run validate-data:frontend
```

**Solutions:**

1. **Force enhanced frontend data update:**
   ```bash
   # Generate with enhanced business data
   npm run setup-data:frontend-only --validate
   
   # Use enhanced frontend-sync-processor directly
   npm run frontend-sync generate --count 10 --scenario normal
   
   # Verify enhanced data structure
   npm run validate-data:business-data
   ```

2. **Check enhanced data generation:**
   ```bash
   # Ensure business data is included
   npm run frontend-sync scenario london-focused --export
   
   # Validate studio relationships
   npm run validate-data:studio-relationships
   
   # Check for missing fields
   npm run frontend-sync validate
   ```

3. **Manual enhanced mock data generation:**
   ```bash
   # Generate fresh enhanced mock data
   cd scripts
   node frontend-sync-processor.js generate --count 5 --business-data --validate
   
   # Test specific scenario
   node frontend-sync-processor.js scenario high-rated --export
   ```

#### Problem: "Enhanced frontend-sync-processor errors" or "Business data generation failures"

**Symptoms:**
- Missing business data in generated mock data
- Studio relationship data not linking properly
- Error responses not following RFC 9457 format
- Data export/import functionality failing

**Diagnosis:**
```bash
# Test enhanced processor directly
cd scripts
node frontend-sync-processor.js validate

# Check business data generation
node frontend-sync-processor.js generate --count 3 --business-data --dry-run

# Validate data structure alignment
npm run validate-data:business-data

# Check studio relationship generation
npm run validate-data:studio-relationships

# Test error response generation
node frontend-sync-processor.js error validation --instance /test
```

**Solutions:**

1. **Reset and regenerate with enhanced features:**
   ```bash
   # Clear existing data and regenerate
   rm -f frontend/src/app/data/mockArtistData.js
   npm run frontend-sync generate --count 5 --scenario normal --validate
   
   # Test specific business data scenarios
   npm run frontend-sync scenario high-rated --export
   ```

2. **Validate enhanced data structure:**
   ```bash
   # Check data structure compliance
   npm run validate-data:frontend
   
   # Verify business data fields
   node -e "
   const fs = require('fs');
   const content = fs.readFileSync('frontend/src/app/data/mockArtistData.js', 'utf8');
   const match = content.match(/export const mockArtistData = (\[[\s\S]*\]);/);
   if (match) {
     const data = JSON.parse(match[1]);
     const sample = data[0] || {};
     console.log('Has rating:', !!sample.rating);
     console.log('Has pricing:', !!sample.pricing);
     console.log('Has availability:', !!sample.availability);
     console.log('Has experience:', !!sample.experience);
     console.log('Has tattooStudio:', !!sample.tattooStudio);
     console.log('Has bio field:', !!sample.bio);
   }
   "
   ```

3. **Debug enhanced processor configuration:**
   ```bash
   # Check processor configuration
   node -e "
   const { FrontendSyncProcessor } = require('./scripts/frontend-sync-processor');
   const processor = new FrontendSyncProcessor();
   console.log('Processor config:', processor.config);
   "
   
   # Test individual components
   cd scripts
   node frontend-sync-processor.js studios
   node frontend-sync-processor.js performance --count 10
   ```

#### Problem: "Data export/import functionality not working"

**Symptoms:**
- Export files not being created
- Import functionality failing to load data
- Exported data missing validation information
- Cross-session data reuse not working

**Solutions:**

1. **Check export directory and permissions:**
   ```bash
   # Ensure export directory exists
   mkdir -p scripts/data-exports
   
   # Check permissions
   ls -la scripts/data-exports/
   
   # Test export functionality
   npm run frontend-sync scenario minimal --export
   ```

2. **Validate export/import process:**
   ```bash
   # List available exports
   npm run frontend-sync list-exports
   
   # Test import functionality
   npm run frontend-sync import scripts/data-exports/latest-export.json
   
   # Validate imported data
   npm run frontend-sync validate-consistency
   ```

#### Problem: "Frontend can't connect to backend services"

**Symptoms:**
- API calls failing in development
- CORS errors in browser console
- Network connection errors

**Solutions:**

1. **Check service endpoints:**
   ```bash
   # Verify backend is running
   npm run dev --workspace=backend
   
   # Check API endpoints
   curl http://localhost:3001/api/health
   ```

2. **Verify environment configuration:**
   ```bash
   # Check frontend environment variables
   cat frontend/.env.local
   
   # Verify API URL configuration
   grep -r "API_URL\|NEXT_PUBLIC" frontend/
   ```

### 🔧 Performance Issues

#### Problem: "Setup taking too long" or "Commands timing out"

**Symptoms:**
```
⏳ Processing images... (5 minutes elapsed)
⚠️  Warning: Operation taking longer than expected
```

**Diagnosis:**
```bash
# Monitor system resources
docker stats

# Check disk I/O
iostat -x 1  # Linux
wmic logicaldisk get size,freespace,caption  # Windows

# Profile command execution
time npm run setup-data
```

**Solutions:**

1. **Use incremental processing:**
   ```bash
   # Let system detect changes (default behavior)
   npm run setup-data
   
   # Only force when necessary
   npm run setup-data:force
   ```

2. **Optimize for development:**
   ```bash
   # Use minimal scenarios
   npm run seed-scenario:minimal
   
   # Use frontend-only mode when possible
   npm run setup-data:frontend-only
   ```

3. **System optimization:**
   ```bash
   # Increase Docker resources
   # - Memory: 4GB+ recommended
   # - CPU: 2+ cores recommended
   # - Storage: SSD preferred
   
   # Clean Docker system
   docker system prune -f
   docker volume prune -f
   ```

#### Problem: "Memory issues" or "Out of memory errors"

**Symptoms:**
```
❌ Error: JavaScript heap out of memory
❌ Error: Docker container killed (OOMKilled)
```

**Solutions:**

1. **Increase Node.js memory:**
   ```bash
   # Increase heap size
   NODE_OPTIONS="--max-old-space-size=4096" npm run setup-data
   ```

2. **Optimize Docker memory:**
   ```bash
   # Check Docker memory usage
   docker stats --no-stream
   
   # Increase Docker Desktop memory allocation
   # Docker Desktop > Settings > Resources > Memory: 4GB+
   ```

3. **Process images in smaller batches:**
   ```bash
   # Configure smaller batch sizes
   BATCH_SIZE=5 npm run setup-data:images-only
   ```

### 🔄 State Management Issues

#### Problem: "Incremental processing not working" or "Changes not detected"

**Symptoms:**
```
✅ No changes detected, skipping processing
# But you know files have changed
```

**Diagnosis:**
```bash
# Check state tracking files
ls -la .kiro/data-management-state/

# View current state
cat .kiro/data-management-state/last-state.json

# Check file checksums
find tests/Test_Data/ImageSet/ -type f -exec md5sum {} \;
```

**Solutions:**

1. **Reset state tracking:**
   ```bash
   # Clear state cache
   rm -rf .kiro/data-management-state/
   
   # Force full processing
   npm run setup-data:force
   ```

2. **Manual change detection:**
   ```bash
   # Check what the system thinks changed
   DEBUG=state-manager npm run setup-data
   ```

#### Problem: "State corruption" or "Inconsistent state tracking"

**Symptoms:**
- System reports conflicting information
- State files contain invalid data
- Incremental processing behaves erratically

**Solutions:**

1. **Reset state completely:**
   ```bash
   # Remove all state files
   rm -rf .kiro/data-management-state/
   
   # Reinitialize system
   npm run setup-data
   ```

2. **Validate state integrity:**
   ```bash
   # Check state file validity
   node -e "
   try {
     const state = require('./.kiro/data-management-state/last-state.json');
     console.log('State valid:', Object.keys(state));
   } catch(e) {
     console.log('State invalid:', e.message);
   }
   "
   ```

### 🐳 Docker Issues

#### Problem: "Docker containers not starting" or "Docker Compose failures"

**Symptoms:**
```
❌ Error: Cannot connect to the Docker daemon
❌ Error: Service 'localstack' failed to build
```

**Diagnosis:**
```bash
# Check Docker daemon
docker version

# Check Docker Compose
docker-compose version

# Check container status
docker-compose ps
```

**Solutions:**

1. **Restart Docker:**
   ```bash
   # Restart Docker Desktop (Windows/Mac)
   # Or restart Docker service (Linux)
   sudo systemctl restart docker  # Linux
   ```

2. **Clean Docker environment:**
   ```bash
   # Stop all containers
   docker-compose down
   
   # Clean system
   docker system prune -f
   
   # Rebuild and restart
   docker-compose up -d --build
   ```

3. **Check Docker resources:**
   - Ensure sufficient disk space (10GB+ free)
   - Verify memory allocation (4GB+ recommended)
   - Check CPU allocation (2+ cores recommended)

#### Problem: "Port conflicts" or "Address already in use"

**Symptoms:**
```
❌ Error: Port 4566 is already in use
❌ Error: Cannot start service localstack: driver failed
```

**Solutions:**

1. **Find conflicting processes:**
   ```bash
   # Check what's using port 4566
   lsof -i :4566  # Linux/Mac
   netstat -ano | findstr :4566  # Windows
   ```

2. **Stop conflicting services:**
   ```bash
   # Kill process using port
   kill -9 <PID>  # Linux/Mac
   taskkill /PID <PID> /F  # Windows
   ```

3. **Use alternative ports:**
   ```bash
   # Modify docker-compose.yml to use different ports
   # Then update configuration accordingly
   ```

## Environment-Specific Issues

### Windows-Specific Issues

#### Problem: "Path separator issues" or "File not found on Windows"

**Solutions:**
```bash
# Use PowerShell instead of Command Prompt
# Ensure WSL 2 is enabled for Docker Desktop
# Use forward slashes in configuration files
```

#### Problem: "Permission denied on Windows"

**Solutions:**
```bash
# Run as Administrator
# Check Windows Defender exclusions
# Verify Docker Desktop has proper permissions
```

### Linux-Specific Issues

#### Problem: "Permission denied" or "Docker socket issues"

**Solutions:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### macOS-Specific Issues

#### Problem: "Docker Desktop performance issues"

**Solutions:**
```bash
# Use VirtioFS for file sharing
# Increase Docker Desktop resources
# Consider using Colima as Docker Desktop alternative
```

### Studio-Specific Diagnostics

#### Studio Data Health Check

Run comprehensive studio data diagnostics:

```bash
# Complete studio health check
npm run validate-studios all

# Check studio data consistency across services
npm run validate-studios consistency

# Validate studio-artist relationships
npm run manage-studio-relationships validate

# Get detailed studio status
npm run studio-status
```

#### Studio Debug Commands

Enable studio-specific debugging:

```bash
# Debug studio data generation
DEBUG=studio-processor npm run seed-studios

# Debug studio image processing
DEBUG=studio-images npm run process-studio-images

# Debug studio relationships
DEBUG=relationship-manager npm run manage-studio-relationships rebuild

# Debug studio frontend sync
DEBUG=studio-sync npm run setup-data:frontend-only
```

#### Studio Data Validation

Validate specific aspects of studio data:

```bash
# Validate studio data structure
npm run validate-studios data

# Validate studio addresses and postcodes
npm run validate-studios addresses

# Validate studio images accessibility
npm run validate-studios images

# Validate studio-artist relationships
npm run validate-studios relationships
```

#### Studio Recovery Procedures

Emergency studio data recovery:

```bash
# Complete studio reset and regeneration
npm run reset-studios
npm run seed-studios --scenario studio-diverse --validate
npm run validate-studios all

# Preserve artists, reset only studios
npm run reset-studios --preserve-relationships
npm run seed-studios --scenario minimal

# Repair broken relationships
npm run manage-studio-relationships repair
npm run validate-studios relationships
```

## Advanced Diagnostics

### Debug Mode

Enable comprehensive debugging:

```bash
# Enable all debug output
DEBUG=* npm run setup-data

# Enable specific component debugging
DEBUG=data-management npm run setup-data
DEBUG=image-processor npm run setup-data
DEBUG=database-seeder npm run setup-data
DEBUG=frontend-sync npm run setup-data
```

### System Information

Gather system information for support:

```bash
# System info script
cat > debug-info.sh << 'EOF'
#!/bin/bash
echo "=== System Information ==="
uname -a
echo ""

echo "=== Docker Information ==="
docker version
docker-compose version
echo ""

echo "=== Node.js Information ==="
node --version
npm --version
echo ""

echo "=== Service Status ==="
docker-compose ps
echo ""

echo "=== Port Usage ==="
lsof -i :4566 2>/dev/null || netstat -ano | findstr :4566
echo ""

echo "=== Disk Space ==="
df -h . 2>/dev/null || dir
echo ""

echo "=== Memory Usage ==="
free -h 2>/dev/null || wmic OS get TotalVisibleMemorySize,FreePhysicalMemory
EOF

chmod +x debug-info.sh
./debug-info.sh
```

### Log Collection

Collect comprehensive logs:

```bash
# Create log collection script
mkdir -p debug-logs
docker-compose logs localstack > debug-logs/localstack.log
npm run health-check > debug-logs/health-check.log 2>&1
npm run data-status > debug-logs/data-status.log 2>&1
DEBUG=* npm run setup-data > debug-logs/setup-debug.log 2>&1

# Package logs for support
tar -czf debug-logs-$(date +%Y%m%d-%H%M%S).tar.gz debug-logs/
```

## Getting Help

### Self-Service Diagnostics

1. **Run comprehensive health check:**
   ```bash
   npm run health-check
   npm run validate-data
   npm run data-status
   ```

2. **Check system requirements:**
   - Docker Desktop with 4GB+ RAM
   - Node.js 18+ with npm 8+
   - 10GB+ free disk space
   - Stable internet connection

3. **Review logs:**
   ```bash
   docker-compose logs localstack
   DEBUG=* npm run setup-data
   ```

### Migration Support

If migrating from legacy scripts:

```bash
# Run migration analysis
cd scripts
node migration-utility.js analyze

# Get detailed migration report
node migration-utility.js full

# Test migration compatibility
node migration-utility.js test
```

### Community Resources

- **Documentation**: Check `docs/DATA_MANAGEMENT_GUIDE.md` for usage examples
- **Migration Guide**: See `docs/MIGRATION_GUIDE.md` for legacy script migration
- **Test Examples**: Review `scripts/__tests__/` for usage patterns
- **Configuration**: Check `scripts/data-config.js` for customization options

### Reporting Issues

When reporting issues, include:

1. **System information** (OS, Docker version, Node.js version)
2. **Error messages** (full error output)
3. **Steps to reproduce** (exact commands run)
4. **Debug logs** (with `DEBUG=*` enabled)
5. **Configuration** (relevant config files)

### Emergency Recovery

If the system is completely broken:

```bash
# Nuclear option - reset everything
docker-compose down -v
docker system prune -af
rm -rf .kiro/data-management-state/
rm -rf node_modules/
npm install
docker-compose up -d localstack
npm run setup-data
```

This will completely reset the system to a clean state, removing all data and cached state.

## Prevention

### Best Practices

1. **Regular health checks**: Run `npm run health-check` daily
2. **Monitor resources**: Keep an eye on Docker resource usage
3. **Update regularly**: Keep Docker Desktop and Node.js updated
4. **Backup configurations**: Version control all configuration changes
5. **Document customizations**: Record any project-specific modifications

### Monitoring

Set up monitoring for early issue detection:

```bash
# Add to your development workflow
alias dev-status='npm run health-check && npm run data-status'

# Run before starting development
dev-status
```

### Maintenance

Regular maintenance tasks:

```bash
# Weekly cleanup
docker system prune -f
npm run validate-data

# Monthly full reset
npm run reset-data:fresh
npm run validate-data
```

This troubleshooting guide covers the most common issues and their solutions. For persistent problems or unique situations, use the diagnostic tools and debug modes to gather more information.