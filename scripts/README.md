# Tattoo Directory Scripts

This directory contains scripts for managing test data and S3 image uploads for the Tattoo Directory project.

## Overview

The scripts help set up realistic test data with proper image handling using LocalStack S3 for local development.

## Files

### Core Scripts

- `setup-test-data.js` - Main orchestrator script that runs the complete setup process
- `upload-images-to-s3.js` - Uploads test images from `tests/Test_Data/ImageSet/` to LocalStack S3
- `update-test-data.js` - Updates test data files with S3 URLs and new style IDs

### Test Data Files

- `test-data/styles.json` - Updated with new style IDs matching image folders
- `test-data/artists.json` - Updated with new styles, S3 image URLs, and faker.js avatars
- `test-data/studios.json` - Updated with matching specialties

### Generated Files

- `image-urls.json` - Generated mapping of style IDs to S3 image URLs (created after upload)

## Usage

### Prerequisites

1. Ensure LocalStack is running with S3 service available
2. Install dependencies:

```bash
cd scripts
npm install
```

### Complete Setup

Run the complete setup process:

```bash
npm run setup
```

This will:
1. Upload all images from `tests/Test_Data/ImageSet/` to LocalStack S3
2. Generate image URL mappings
3. Update test data files with S3 URLs and new style IDs

### Individual Scripts

Upload images only:
```bash
npm run upload-images
```

Update test data only (requires existing `image-urls.json`):
```bash
npm run update-data
```

## Style ID Updates

The following style IDs have been updated to match the image folder structure:

- `watercolour` (was `watercolor`)
- `tribal` (new)
- `traditional` (unchanged)
- `surrealism` (new)
- `sketch` (new)
- `realism` (unchanged)
- `psychedelic` (new, folder: `psychelic`)
- `old_school` (new)
- `new_school` (was `new-school`)
- `neo_traditional` (was `neo-traditional`)
- `minimalism` (new)
- `lettering` (new)
- `geometric` (unchanged)
- `floral` (new)
- `fineline` (unchanged)
- `blackwork` (unchanged)
- `dotwork` (new)

## Image Handling

### LocalStack S3 Structure

Images are uploaded to the `tattoo-directory-images` bucket with the following structure:

```
tattoo-directory-images/
├── styles/
│   ├── watercolour/
│   │   ├── tattoo_1.png
│   │   └── tattoo_2.png
│   ├── tribal/
│   │   ├── tattoo_3.png
│   │   └── tattoo_4.png
│   └── ...
```

### Image URLs

LocalStack S3 URLs follow the pattern:
```
http://localhost:4566/tattoo-directory-images/styles/{styleId}/{filename}
```

### Artist Avatars

Artist avatars use the faker.js CDN:
```
https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/portrait-{id}.jpg
```

## Environment Variables

- `AWS_ENDPOINT_URL` - LocalStack endpoint (default: `http://localhost:4566`)
- `AWS_ACCESS_KEY_ID` - AWS access key (default: `test`)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (default: `test`)
- `AWS_DEFAULT_REGION` - AWS region (default: `eu-west-2`)

## Integration with Data Seeder

The updated test data files are used by the data seeder in `scripts/data-seeder/` to populate LocalStack services with realistic data including proper image URLs.

## Troubleshooting

### LocalStack Not Available

Ensure LocalStack is running and S3 service is available:
```bash
docker-compose -f docker-compose.local.yml up localstack
```

### Permission Issues

Check that the image files in `tests/Test_Data/ImageSet/` are readable and LocalStack has proper permissions.

### Missing Images

If some style folders are missing images, the script will skip them and log warnings. Check the `tests/Test_Data/ImageSet/` directory structure.