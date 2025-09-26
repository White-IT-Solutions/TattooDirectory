#!/bin/bash

# Script to run the data seeder container manually

echo "🌱 Running data seeder..."

# Build and run the seeder container
docker-compose -f docker-compose.local.yml build data-seeder

# Run the seeder (it will exit after completion)
docker-compose -f docker-compose.local.yml run --rm data-seeder

echo "✅ Data seeding completed"