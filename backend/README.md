# Backend Development Guide

## Prerequisites
- Node.js 20.x
- AWS CLI configured
- Serverless Framework CLI

## Setup
```bash
npm install
npm install -g serverless
```

## Local Development
```bash
# Install serverless-offline plugin
npm install --save-dev serverless-offline

# Start local API
serverless offline
```

## Deploy to AWS
```bash
serverless deploy
```

## Environment Variables
- `TABLE_NAME`: DynamoDB table name (auto-set by Serverless)

## API Endpoints
- `GET /artist/{id}` - Get single artist
- `GET /artists` - List all artists (paginated)
- `GET /artists/{styles}` - Get artists by styles
- `PATCH /artist/{id}` - Update artist
- `POST /removal-requests` - Submit removal request