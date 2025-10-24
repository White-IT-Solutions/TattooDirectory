### Terraform Module Dependency Flow

graph TD
    %% Foundation Layer
    subgraph "Foundation Layer"
        F01[01-foundation<br/>KMS Keys, Code Signing]
        F03[03-audit-foundation<br/>Audit Account Setup]
    end

    %% Security & Networking Layer
    subgraph "Security & Networking Layer"
        S04[04-central-logging<br/>Kinesis Firehose]
        S05[05-networking<br/>VPC, Subnets, NAT]
        S06[06-central-security<br/>GuardDuty, Security Hub]
        S07[07-app-security<br/>WAF, Secrets Manager]
    end

    %% Data & Storage Layer
    subgraph "Data & Storage Layer"
        D08[08-log-storage<br/>S3 Audit Buckets]
        D09[09-app-storage<br/>DynamoDB, S3 App Data]
        D10[10-search<br/>OpenSearch Cluster]
    end

    %% Compute & API Layer
    subgraph "Compute & API Layer"
        C11[11-iam<br/>Roles & Policies]
        C12[12-compute<br/>Lambda, ECS, Step Functions]
        C13[13-api<br/>API Gateway HTTP API]
    end

    %% Operations Layer
    subgraph "Operations Layer"
        O14[14-security-monitoring<br/>Security Alerts]
        O15[15-app-monitoring<br/>Performance Dashboards]
        O16[16-backup<br/>Disaster Recovery]
        O17[17-governance<br/>Config, CloudTrail]
        O19[19-delivery<br/>CloudFront CDN]
    end

    %% Dependencies
    F01 --> F03
    F01 --> S04
    F01 --> S05
    F01 --> S06
    F01 --> S07
    F01 --> D08
    F01 --> D09
    F01 --> D10
    F01 --> C11

    F03 --> D08
    S05 --> D10
    S05 --> C12
    S07 --> C12
    C11 --> C12
    C11 --> C13
    D09 --> C12
    D10 --> C12
    C12 --> C13

    S04 --> O14
    S06 --> O14
    D09 --> O15
    C12 --> O15
    C13 --> O15
    D09 --> O16
    F01 --> O17
    C13 --> O19

    %% Styling
    classDef foundation fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef security fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef compute fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef operations fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class F01,F03 foundation
    class S04,S05,S06,S07 security
    class D08,D09,D10 data
    class C11,C12,C13 compute
    class O14,O15,O16,O17,O19 operations