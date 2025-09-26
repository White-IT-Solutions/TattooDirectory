#!/bin/bash

# OpenSearch Domain Creation Script for LocalStack
# This script creates an OpenSearch domain for artist search functionality

echo "Creating OpenSearch domain: tattoo-directory-local"

# Create OpenSearch domain
awslocal opensearch create-domain \
    --domain-name tattoo-directory-local \
    --engine-version "OpenSearch_2.3" \
    --cluster-config \
        InstanceType=t3.small.search,InstanceCount=1,DedicatedMasterEnabled=false \
    --ebs-options \
        EBSEnabled=true,VolumeType=gp2,VolumeSize=10 \
    --access-policies '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "es:*",
                "Resource": "arn:aws:es:eu-west-2:000000000000:domain/tattoo-directory-local/*"
            }
        ]
    }' \
    --region eu-west-2

echo "Waiting for OpenSearch domain to be active..."
sleep 30

# Get domain endpoint
OPENSEARCH_ENDPOINT=$(awslocal opensearch describe-domain --domain-name tattoo-directory-local --region eu-west-2 --query 'DomainStatus.Endpoint' --output text)
echo "OpenSearch domain endpoint: https://$OPENSEARCH_ENDPOINT"

# Wait a bit more for the domain to be fully ready
sleep 10

# Create index mapping for artists
echo "Creating artist index mapping..."
curl -X PUT "http://localhost:4566/tattoo-directory-local/_mapping" \
    -H "Content-Type: application/json" \
    -d '{
        "properties": {
            "artistId": {
                "type": "keyword"
            },
            "artistName": {
                "type": "text",
                "analyzer": "standard",
                "fields": {
                    "keyword": {
                        "type": "keyword"
                    }
                }
            },
            "instagramHandle": {
                "type": "keyword"
            },
            "geohash": {
                "type": "keyword"
            },
            "locationDisplay": {
                "type": "text",
                "analyzer": "standard"
            },
            "styles": {
                "type": "keyword"
            },
            "portfolioImages": {
                "type": "nested",
                "properties": {
                    "url": {
                        "type": "keyword"
                    },
                    "description": {
                        "type": "text",
                        "analyzer": "standard"
                    },
                    "style": {
                        "type": "keyword"
                    }
                }
            },
            "contactInfo": {
                "type": "object",
                "properties": {
                    "instagram": {
                        "type": "keyword"
                    },
                    "website": {
                        "type": "keyword"
                    },
                    "email": {
                        "type": "keyword"
                    },
                    "phone": {
                        "type": "keyword"
                    }
                }
            },
            "createdAt": {
                "type": "date"
            },
            "updatedAt": {
                "type": "date"
            }
        }
    }'

echo "OpenSearch domain 'tattoo-directory-local' created successfully!"