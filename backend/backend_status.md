C:.
│   api-config.js (Artemis)
│   package-lock.json (Artemis)
│   package.json (Artemis)
│   README.md (Artemis)
│   serverless.yml (Artemis)
│   test-requests.http (Artemis)
│
├───src (Artemis)
|   |
│   │ # Serverless Framework (Currently Deployed)
│   │ # Status: Working but uses mock data
|   | # Files: Basic handlers, DynamoDB client, utility functions
│   │ # Issues: Doesn't match design specs, no real data integration
│   │
│   │   db.js (Artemis)
│   │
│   ├───data (Artemis)
│   │       mockData.js 
│   │
│   ├───handlers (Artemis)
│   │       getArtist.js 
│   │       getArtistsByStyles.js 
│   │       listArtists.js
│   │       postRemovalRequest.js 
│   │       updateArtist.js
│   │
│   ├───lib (Artemis)
│   │       keys.js
│   │       normalize.js 
│   │
│   └───tools (Artemis)
│           putArtist.js
│
├───src_boilerplate (??)
|   |
│   | # Status: Well-designed but not deployed
|   | # Components:
|   | # Complete OpenSearch integration with circuit breaker
|   | # Google Maps API studio discovery
│   | # Website scraping for artist finding
|   | # DynamoDB to OpenSearch sync
|   | # PII-scrubbing structured logger
|   | # Secrets management and rotation
│   | # Quality: Production-ready, matches design specifications
|   | #
|   |
│   ├───api_handler
│   │       api_handler.js
│   │       api_handler_idempotency.js
│   │
│   ├───common (??)
│   │       logger.js
│   │
│   ├───config_compliance_processor (??)
│   │       config_compliance_processor_index.js
│   │
│   ├───discover_studios (??)
│   │       discover_studios.js
│   │       discover_studios_index.js
│   │       Pseudocode for discover_studios.md
│   │
│   ├───dynamodb_sync (??)
│   │       dynamodb_sync.js
│   │       dynamodb_sync_index.js
│   │
│   ├───find_artists_on_site (??)
│   │       find_artists_on_site_index.js
│   │       find_artists_on_site_pseudocode.md
│   │
│   ├───misc (??)
│   │       Fargate_Scraper_Container_Logic.js
│   │
│   ├───operations (??)
│   │   └───rotate_eip
│   │           rotate-nat-gateway-eip.py
│   │
│   ├───queue_scraping (??)
│   │       queue_scraping.js
│   │       queue_scraping_index.js
│   │
│   ├───scraper (??)
│   │   └───Dockerfile
│   │           dockerfile_scraper.dockerfile
│   │
│   └───secret_rotation (??)
│           README.md
│           requirements.txt
│           secret_rotation.py
│
└───src_compute_module (??)
    |
    | # Status: Placeholder implementations only
    | # Files: Basic Lambda stubs and pre-built ZIP files
    | # Purpose: Intended for Terraform deployment but not functiona
    | 
    ├───dist (??)
    │       api_handler.zip
    │       discover_studios.zip
    │       dynamodb_sync.zip
    │       find_artists.zip
    │       queue_scraping.zip
    │
    └───lambda_code (??)
            api_handler.js
            discover_studios.js
            dynamodb_sync.js
            find_artists.js
            queue_scraping.js