### Multi-Account Architecture Flow

graph LR
    subgraph "Infrastructure Account"
        subgraph "Application Stack"
            API[API Gateway]
            LAMBDA[Lambda Functions]
            DDB[DynamoDB]
            OS[OpenSearch]
            S3APP[S3 App Data]
        end

        subgraph "Frontend Stack"
            CF[CloudFront]
            S3WEB[S3 Website]
        end
    end

    subgraph "Security Account"
        GD[GuardDuty]
        SH[Security Hub]
        IAA[IAM Access Analyzer]
    end

    subgraph "Audit Account"
        CT[CloudTrail]
        CW[CloudWatch Logs]
        S3AUDIT[S3 Audit Buckets]
        BACKUP[Backup Vaults]
    end

    %% Data Flow
    API --> LAMBDA
    LAMBDA --> DDB
    LAMBDA --> OS
    LAMBDA --> S3APP
    CF --> S3WEB
    CF --> API

    %% Security Monitoring
    LAMBDA -.-> GD
    API -.-> GD
    DDB -.-> GD

    GD --> SH
    IAA --> SH

    %% Audit Flow
    API -.-> CT
    LAMBDA -.-> CT
    DDB -.-> CT

    CT --> CW
    CW --> S3AUDIT
    DDB -.-> BACKUP
    S3APP -.-> BACKUP

    %% Styling
    classDef infra fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef security fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef audit fill:#f1f8e9,stroke:#388e3c,stroke-width:2px

    class API,LAMBDA,DDB,OS,S3APP,CF,S3WEB infra
    class GD,SH,IAA security
    class CT,CW,S3AUDIT,BACKUP audit