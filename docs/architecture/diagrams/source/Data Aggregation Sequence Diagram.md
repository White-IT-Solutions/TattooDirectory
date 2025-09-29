### **Data Aggregation Sequence Diagram**

This diagram shows the complete data aggregation pipeline including DynamoDB Streams synchronization, GSI key generation, error handling, retry logic, and cross-account monitoring integration.

```mermaid
sequenceDiagram
    participant EBS as Amazon EventBridge Scheduler
    participant SFW as AWS Step Functions Workflow
    participant SQS as Amazon SQS ScrapingQueue
    participant FST as AWS Fargate Scraper Task
    participant DDB as Amazon DynamoDB DataTable
    participant DDBS as DynamoDB Streams
    participant SYNC as IndexSync Lambda Function
    participant OS as Amazon OpenSearch
    participant CW as CloudWatch (Infrastructure Account)
    participant CWA as CloudWatch (Audit Account)
    participant SNS as SNS Error Notifications

    Note over EBS,SNS: Infrastructure Account (773595699997)
    
    EBS->>SFW: Trigger daily cron(0 2 * * ? *)
    activate SFW

    SFW->>SFW: DiscoverStudios (Lambda Task)
    Note right of SFW: Exponential backoff retry<br/>for external API calls
    
    alt Google Maps API Success
        SFW->>SFW: FindArtistsOnSite (Lambda Task)
        SFW->>SQS: QueueScrapingJobs (Lambda Task)<br>Sends a message for each artist
    else API Failure/Rate Limit
        SFW->>CW: Log error with retry count
        SFW->>SFW: Wait with exponential backoff
        SFW->>SFW: Retry DiscoverStudios (up to 3 attempts)
        alt Max retries exceeded
            SFW->>SNS: Send failure notification
            SFW->>CW: Log critical failure
        end
    end

    deactivate SFW

    Note over SQS,FST: Fargate auto-scales based on queue depth,<br>processing messages concurrently.

    loop For each available message
        activate FST
        FST->>SQS: Pulls message
        activate SQS
        SQS-->>FST: Returns message data
        deactivate SQS

        Note right of FST: Intensive scraping of public<br/>portfolio website occurs here.

        alt Scraping Success
            Note right of FST: GSI Key Generation Process:<br/>• gsi1pk: STYLE#{style_name}<br/>• gsi1sk: LOCATION#{country}#{city}#{artistId}<br/>• gsi2pk: INSTAGRAM#{handle}
            
            FST->>FST: Generate GSI keys from scraped data
            FST->>FST: Validate data completeness
            FST->>DDB: Writes aggregated portfolio data<br/>with generated GSI keys
            activate DDB
            DDB-->>FST: Confirms write operation
            
            Note over DDB,DDBS: DynamoDB Streams captures<br/>INSERT/MODIFY/REMOVE events
            DDB->>DDBS: Stream record created
            activate DDBS
            
            DDBS->>SYNC: Trigger IndexSync Lambda
            activate SYNC
            
            alt OpenSearch Sync Success
                SYNC->>SYNC: Transform DynamoDB record<br/>to OpenSearch document
                SYNC->>OS: Index/Update/Delete document
                activate OS
                OS-->>SYNC: Confirm operation
                deactivate OS
                SYNC->>CW: Log successful sync
            else OpenSearch Sync Failure
                SYNC->>CW: Log sync error with details
                SYNC->>SYNC: Retry with exponential backoff<br/>(up to 3 attempts)
                alt Max retries exceeded
                    SYNC->>SNS: Send sync failure alert
                    SYNC->>CW: Log critical sync failure
                end
            end
            
            deactivate SYNC
            deactivate DDBS
            deactivate DDB
            
            FST->>CW: Log successful scraping metrics
            FST->>SQS: Deletes message from queue
            
        else Scraping Failure
            FST->>CW: Log scraping error with artist details
            alt Retryable Error (network, rate limit)
                FST->>SQS: Return message to queue<br/>with visibility timeout
                Note right of FST: Message becomes visible<br/>again after timeout for retry
            else Non-retryable Error (blocked IP, invalid data)
                FST->>CW: Log permanent failure
                FST->>SNS: Send scraping failure alert
                FST->>SQS: Delete message (poison message)
            end
        end
        
        deactivate FST
    end

    Note over CW,CWA: Cross-Account Monitoring Integration

    CW->>CWA: Stream application logs<br/>to Audit Account
    Note right of CWA: Security monitoring and<br/>compliance tracking

    rect rgb(255, 245, 238)
        Note over EBS,SNS: Error Handling & Monitoring Summary:<br/>• Step Functions: Exponential backoff for external APIs<br/>• Fargate: Retry logic for transient failures<br/>• IndexSync Lambda: Automatic OpenSearch retry<br/>• CloudWatch: Comprehensive logging across accounts<br/>• SNS: Real-time failure notifications<br/>• DLQ: Dead letter queue for poison messages
    end

    rect rgb(240, 248, 255)
        Note over DDB,OS: Data Synchronization Flow:<br/>• DynamoDB Streams capture all table changes<br/>• IndexSync Lambda processes stream events in batches<br/>• OpenSearch index updated in near real-time (< 30s)<br/>• Handles INSERT, MODIFY, REMOVE operations<br/>• Maintains data consistency between DynamoDB and OpenSearch
    end
```

## Enhanced Features

### DynamoDB Streams Integration
- **Stream Configuration**: DynamoDB table configured with streams to capture INSERT, MODIFY, and REMOVE events
- **Event Processing**: IndexSync Lambda function processes stream events in batches for efficiency
- **Real-time Synchronization**: OpenSearch index updated within 30 seconds of DynamoDB changes
- **Event Types Handling**: Different processing logic for INSERT (create document), MODIFY (update document), and REMOVE (delete document) operations

### GSI Key Generation Process
The Fargate scraper tasks generate Global Secondary Index keys to enable efficient search queries:

- **GSI1 (Style-based search)**:
  - `gsi1pk`: `STYLE#{style_name}` (e.g., `STYLE#traditional`)
  - `gsi1sk`: `LOCATION#{country}#{city}#{artistId}` (e.g., `LOCATION#UK#LONDON#artist-123`)
  
- **GSI2 (Instagram-based lookup)**:
  - `gsi2pk`: `INSTAGRAM#{handle}` (e.g., `INSTAGRAM#alextattoo`)

These keys are computed from scraped data including inferred styles, location information, and social media handles.

### Error Handling and Retry Logic

#### Step Functions Level
- **External API Calls**: Exponential backoff retry for Google Maps API calls
- **Rate Limiting**: Automatic retry with increasing delays when APIs return rate limit errors
- **Circuit Breaker**: Stops retrying after maximum attempts to prevent cascading failures

#### Fargate Scraper Level
- **Transient Failures**: Network timeouts and temporary site unavailability trigger message return to SQS with visibility timeout
- **Permanent Failures**: Blocked IPs or invalid data result in message deletion to prevent infinite retries
- **Dead Letter Queue**: Poison messages moved to DLQ after maximum retry attempts

#### IndexSync Lambda Level
- **OpenSearch Failures**: Automatic retry with exponential backoff for index operations
- **Batch Processing**: Processes multiple stream records in batches for efficiency
- **Error Isolation**: Individual record failures don't affect the entire batch

### Monitoring and Alerting Integration

#### Infrastructure Account Monitoring
- **CloudWatch Metrics**: Scraping success rates, processing times, queue depths
- **Application Logs**: Detailed logging of scraping activities and data processing
- **Performance Tracking**: Lambda execution times, Fargate task utilization

#### Cross-Account Security Monitoring
- **Audit Account Integration**: Application logs streamed to Audit Account for security analysis
- **Compliance Tracking**: Data processing activities monitored for compliance requirements
- **Incident Response**: Automated alerts for critical failures or security events

#### Real-time Notifications
- **SNS Integration**: Immediate notifications for critical failures
- **Dashboard Alerts**: CloudWatch alarms for key performance indicators
- **Escalation Procedures**: Automated escalation for unresolved issues

### Data Consistency and Quality

#### Validation Pipeline
- **Data Completeness**: Validation of required fields before DynamoDB write
- **Format Standardization**: Consistent data formatting across all records
- **Duplicate Detection**: GSI2 enables efficient duplicate detection by Instagram handle

#### Synchronization Guarantees
- **Eventually Consistent**: OpenSearch index eventually consistent with DynamoDB
- **Retry Mechanisms**: Automatic retry ensures synchronization completion
- **Monitoring**: Real-time monitoring of synchronization lag and failures

### Cross-Account Architecture Context

This data aggregation pipeline operates within the AWS Control Tower multi-account structure:

- **Infrastructure Account (773595699997)**: Hosts all data processing components
- **Audit Account (098819594789)**: Receives application logs for security monitoring
- **Log Archive Account (224425919836)**: Stores long-term logs and backup data

The pipeline respects account boundaries while enabling necessary cross-account data flows for monitoring and compliance.