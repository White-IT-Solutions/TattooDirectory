# Static Export Testing Checklist

This checklist guides the process of validating the static export functionality of the Next.js migration for deployment to AWS S3/CloudFront.

## Build Configuration

### Next.js Configuration
- [ ] Verify `output: 'export'` is set in next.config.js
- [ ] Check image optimization settings for static export
- [ ] Verify trailing slash configuration is appropriate for S3
- [ ] Check experimental features configuration

### Static Export Process
- [ ] Run `next build` successfully
- [ ] Verify `out` directory is generated
- [ ] Check for any build warnings or errors
- [ ] Verify all expected files are generated

## File Structure

### HTML Files
- [ ] Verify index.html is generated for each route
- [ ] Check for proper HTML structure in generated files
- [ ] Verify meta tags and SEO elements are preserved
- [ ] Check for proper encoding and doctype

### Assets
- [ ] Verify all JavaScript files are generated correctly
- [ ] Check CSS files for proper content
- [ ] Verify image files are copied to the output directory
- [ ] Check font files and other static assets

## Functionality Testing

### Local Testing
- [ ] Serve the static export locally
- [ ] Test all pages and navigation
- [ ] Verify all interactive elements work
- [ ] Check for any console errors

### S3 Compatibility
- [ ] Verify file paths work with S3 structure
- [ ] Check for absolute vs relative paths
- [ ] Verify index.html files work with S3 directory structure
- [ ] Test with S3 website hosting configuration

### CloudFront Compatibility
- [ ] Verify routing works with CloudFront
- [ ] Check cache control headers
- [ ] Test CloudFront functions or Lambda@Edge if used
- [ ] Verify error pages work correctly

## Client-Side Features

### Navigation
- [ ] Test client-side navigation between pages
- [ ] Verify browser history works correctly
- [ ] Test deep linking to specific routes
- [ ] Check for any hydration errors

### Data Fetching
- [ ] Verify all data is properly pre-rendered
- [ ] Test client-side data fetching
- [ ] Check for any missing data in the static export
- [ ] Verify API calls work correctly

### Interactive Elements
- [ ] Test all forms and input elements
- [ ] Verify client-side validation works
- [ ] Test all buttons and interactive components
- [ ] Check for any JavaScript errors

## Running the Tests

### Build and Export
```bash
npm run build
```

### Serve Static Export Locally
```bash
npx serve out
```

### Test Static Export
```bash
node scripts/test-static-export.js
```

### Verify Configuration
```bash
node scripts/verify-static-export-config.js
```

## Documentation

Document any issues found during testing:
1. Area where the issue occurs
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots or videos if applicable

## Results

All test results are saved to the `static-export-results` directory. Review these results to identify:

1. Static export issues that need to be addressed
2. Configuration improvements for S3/CloudFront compatibility
3. Client-side functionality issues in the static export

Document your findings and recommendations for further improvements in the migration notes.