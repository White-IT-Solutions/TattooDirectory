@echo off
REM Script to run the data seeder container manually on Windows

echo 🌱 Running data seeder...

REM Build and run the seeder container
docker-compose -f docker-compose.local.yml build data-seeder

REM Run the seeder (it will exit after completion)
docker-compose -f docker-compose.local.yml run --rm data-seeder

echo ✅ Data seeding completed
pause