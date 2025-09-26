#!/bin/bash

# S3 Bucket Creation Script for LocalStack
# This script creates S3 buckets for image storage simulation

echo "Creating S3 buckets for image storage..."

# Create main portfolio images bucket
awslocal s3 mb s3://tattoo-directory-portfolio-images-local --region eu-west-2

# Create thumbnails bucket
awslocal s3 mb s3://tattoo-directory-thumbnails-local --region eu-west-2

# Create temporary uploads bucket
awslocal s3 mb s3://tattoo-directory-uploads-local --region eu-west-2

# Create test images bucket (used by test data)
awslocal s3 mb s3://tattoo-directory-images --region eu-west-2

# Set bucket policies for public read access (for local testing)
echo "Setting bucket policies..."

# Portfolio images bucket policy
awslocal s3api put-bucket-policy \
    --bucket tattoo-directory-portfolio-images-local \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::tattoo-directory-portfolio-images-local/*"
            }
        ]
    }'

# Thumbnails bucket policy
awslocal s3api put-bucket-policy \
    --bucket tattoo-directory-thumbnails-local \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::tattoo-directory-thumbnails-local/*"
            }
        ]
    }'

# Test images bucket policy
awslocal s3api put-bucket-policy \
    --bucket tattoo-directory-images \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::tattoo-directory-images/*"
            }
        ]
    }'

# Enable CORS for all buckets
echo "Configuring CORS..."

CORS_CONFIG='{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}'

awslocal s3api put-bucket-cors --bucket tattoo-directory-portfolio-images-local --cors-configuration "$CORS_CONFIG"
awslocal s3api put-bucket-cors --bucket tattoo-directory-thumbnails-local --cors-configuration "$CORS_CONFIG"
awslocal s3api put-bucket-cors --bucket tattoo-directory-uploads-local --cors-configuration "$CORS_CONFIG"
awslocal s3api put-bucket-cors --bucket tattoo-directory-images --cors-configuration "$CORS_CONFIG"

# Create some sample directories
echo "Creating sample directory structure..."
awslocal s3api put-object --bucket tattoo-directory-portfolio-images-local --key "artists/" --body /dev/null
awslocal s3api put-object --bucket tattoo-directory-portfolio-images-local --key "styles/" --body /dev/null
awslocal s3api put-object --bucket tattoo-directory-thumbnails-local --key "artists/" --body /dev/null

# List created buckets
echo "Created S3 buckets:"
awslocal s3 ls

echo "S3 buckets created successfully!"