### **Network Architecture Diagram (VPC)**

```mermaid
flowchart TD
    subgraph Internet_Zone["Internet"]
        Internet(["Internet"])
        Users["Users & External APIs"]
    end

    subgraph AWS_Services["AWS Services (Regional)"]
        S3["S3 Buckets"]
        DynamoDB["DynamoDB Tables"]
        SecretsManager["Secrets Manager"]
        SQS["SQS Queues"]
        StepFunctions["Step Functions"]
        ECR_API["ECR API"]
        ECR_DKR["ECR Docker Registry"]
        CloudWatchLogs["CloudWatch Logs"]
        OpenSearchService["OpenSearch Service"]
    end

    subgraph VPC["VPC (10.0.0.0/16)"]
        IGW["Internet Gateway"]
        
        subgraph AZ_A["Availability Zone A"]
            subgraph PublicSubnetA["Public Subnet A (10.0.1.0/24)"]
                NAT_GW_A["NAT Gateway A"]
            end
            
            subgraph PrivateSubnetA["Private Subnet A (10.0.11.0/24)"]
                Lambda_ENI_A["Lambda ENI A"]
                Fargate_A["Fargate Task A"]
                OpenSearch_A["OpenSearch Node A"]
                
                subgraph Interface_Endpoints_A["Interface VPC Endpoints A"]
                    VPCE_Secrets_A["Secrets Manager<br/>Interface Endpoint"]
                    VPCE_SQS_A["SQS<br/>Interface Endpoint"]
                    VPCE_States_A["Step Functions<br/>Interface Endpoint"]
                    VPCE_ECR_API_A["ECR API<br/>Interface Endpoint"]
                    VPCE_ECR_DKR_A["ECR Docker<br/>Interface Endpoint"]
                    VPCE_Logs_A["CloudWatch Logs<br/>Interface Endpoint"]
                    VPCE_ES_A["OpenSearch<br/>Interface Endpoint"]
                end
            end
        end

        subgraph AZ_B["Availability Zone B"]
            subgraph PublicSubnetB["Public Subnet B (10.0.2.0/24)"]
                NAT_GW_B["NAT Gateway B"]
            end
            
            subgraph PrivateSubnetB["Private Subnet B (10.0.12.0/24)"]
                Lambda_ENI_B["Lambda ENI B"]
                Fargate_B["Fargate Task B"]
                OpenSearch_B["OpenSearch Node B"]
                
                subgraph Interface_Endpoints_B["Interface VPC Endpoints B"]
                    VPCE_Secrets_B["Secrets Manager<br/>Interface Endpoint"]
                    VPCE_SQS_B["SQS<br/>Interface Endpoint"]
                    VPCE_States_B["Step Functions<br/>Interface Endpoint"]
                    VPCE_ECR_API_B["ECR API<br/>Interface Endpoint"]
                    VPCE_ECR_DKR_B["ECR Docker<br/>Interface Endpoint"]
                    VPCE_Logs_B["CloudWatch Logs<br/>Interface Endpoint"]
                    VPCE_ES_B["OpenSearch<br/>Interface Endpoint"]
                end
            end
        end

        subgraph Gateway_Endpoints["Gateway VPC Endpoints"]
            S3_GW["S3 Gateway Endpoint<br/>(Route Table Integration)"]
            DDB_GW["DynamoDB Gateway Endpoint<br/>(Route Table Integration)"]
        end

        subgraph Route_Tables["Route Tables"]
            Public_RT["Public Route Table<br/>0.0.0.0/0 → IGW"]
            Private_RT_A["Private Route Table A<br/>0.0.0.0/0 → NAT-GW-A<br/>S3/DDB → Gateway Endpoints"]
            Private_RT_B["Private Route Table B<br/>0.0.0.0/0 → NAT-GW-B<br/>S3/DDB → Gateway Endpoints"]
        end

        subgraph Security_Groups["Security Groups"]
            SG_Lambda_Internet["Lambda Internet SG<br/>Egress: 443→VPC Endpoints<br/>Egress: 443→Internet<br/>Egress: 443→OpenSearch"]
            SG_Lambda_Internal["Lambda Internal SG<br/>Egress: 443→VPC Endpoints<br/>Egress: 443→OpenSearch"]
            SG_Fargate["Fargate SG<br/>Egress: 443→VPC Endpoints"]
            SG_VPC_Endpoints["VPC Endpoints SG<br/>Ingress: 443←Lambda SGs<br/>Ingress: 443←Fargate SG"]
            SG_OpenSearch["OpenSearch SG<br/>Ingress: 443←Lambda SGs"]
        end
    end

    subgraph Lambda_Service["AWS Lambda Service"]
        Lambda_Internet["Lambda Functions<br/>(Internet Access)"]
        Lambda_Internal["Lambda Functions<br/>(Internal Only)"]
    end

    %% Internet Traffic Flow
    Users -.->|HTTPS API Calls| Internet
    Internet -->|User Traffic| IGW
    IGW --> PublicSubnetA
    IGW --> PublicSubnetB

    %% NAT Gateway Traffic (Internet-bound from private subnets)
    Lambda_ENI_A -.->|Internet Traffic<br/>(Web Scraping)| NAT_GW_A
    Lambda_ENI_B -.->|Internet Traffic<br/>(Web Scraping)| NAT_GW_B
    NAT_GW_A --> IGW
    NAT_GW_B --> IGW

    %% Lambda Hyperplane ENI Placement
    Lambda_Internet -.->|Hyperplane ENI| Lambda_ENI_A
    Lambda_Internet -.->|Hyperplane ENI| Lambda_ENI_B
    Lambda_Internal -.->|Hyperplane ENI| Lambda_ENI_A
    Lambda_Internal -.->|Hyperplane ENI| Lambda_ENI_B

    %% Gateway Endpoint Traffic (S3 & DynamoDB)
    Lambda_ENI_A -->|S3/DynamoDB Traffic<br/>via Route Table| S3_GW
    Lambda_ENI_A -->|S3/DynamoDB Traffic<br/>via Route Table| DDB_GW
    Lambda_ENI_B -->|S3/DynamoDB Traffic<br/>via Route Table| S3_GW
    Lambda_ENI_B -->|S3/DynamoDB Traffic<br/>via Route Table| DDB_GW
    Fargate_A -->|S3/DynamoDB Traffic<br/>via Route Table| S3_GW
    Fargate_A -->|S3/DynamoDB Traffic<br/>via Route Table| DDB_GW
    Fargate_B -->|S3/DynamoDB Traffic<br/>via Route Table| S3_GW
    Fargate_B -->|S3/DynamoDB Traffic<br/>via Route Table| DDB_GW

    %% Interface Endpoint Traffic (AWS Services)
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_Secrets_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_SQS_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_States_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_ECR_API_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_ECR_DKR_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_Logs_A
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| VPCE_ES_A

    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_Secrets_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_SQS_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_States_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_ECR_API_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_ECR_DKR_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_Logs_B
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| VPCE_ES_B

    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_Secrets_A
    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_SQS_A
    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_States_A
    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_ECR_API_A
    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_ECR_DKR_A
    Fargate_A -->|HTTPS:443<br/>SG Rules| VPCE_Logs_A

    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_Secrets_B
    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_SQS_B
    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_States_B
    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_ECR_API_B
    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_ECR_DKR_B
    Fargate_B -->|HTTPS:443<br/>SG Rules| VPCE_Logs_B

    %% OpenSearch Traffic (Direct connection within VPC)
    Lambda_ENI_A -->|HTTPS:443<br/>SG Rules| OpenSearch_A
    Lambda_ENI_B -->|HTTPS:443<br/>SG Rules| OpenSearch_B

    %% PrivateLink Connections to AWS Services
    S3_GW -.->|PrivateLink| S3
    DDB_GW -.->|PrivateLink| DynamoDB
    VPCE_Secrets_A -.->|PrivateLink| SecretsManager
    VPCE_Secrets_B -.->|PrivateLink| SecretsManager
    VPCE_SQS_A -.->|PrivateLink| SQS
    VPCE_SQS_B -.->|PrivateLink| SQS
    VPCE_States_A -.->|PrivateLink| StepFunctions
    VPCE_States_B -.->|PrivateLink| StepFunctions
    VPCE_ECR_API_A -.->|PrivateLink| ECR_API
    VPCE_ECR_API_B -.->|PrivateLink| ECR_API
    VPCE_ECR_DKR_A -.->|PrivateLink| ECR_DKR
    VPCE_ECR_DKR_B -.->|PrivateLink| ECR_DKR
    VPCE_Logs_A -.->|PrivateLink| CloudWatchLogs
    VPCE_Logs_B -.->|PrivateLink| CloudWatchLogs
    VPCE_ES_A -.->|PrivateLink| OpenSearchService
    VPCE_ES_B -.->|PrivateLink| OpenSearchService

    %% Route Table Associations
    PublicSubnetA -.->|Associated| Public_RT
    PublicSubnetB -.->|Associated| Public_RT
    PrivateSubnetA -.->|Associated| Private_RT_A
    PrivateSubnetB -.->|Associated| Private_RT_B
    S3_GW -.->|Route Table Integration| Private_RT_A
    S3_GW -.->|Route Table Integration| Private_RT_B
    DDB_GW -.->|Route Table Integration| Private_RT_A
    DDB_GW -.->|Route Table Integration| Private_RT_B

    %% Security Group Associations
    Lambda_ENI_A -.->|Protected by| SG_Lambda_Internet
    Lambda_ENI_A -.->|Protected by| SG_Lambda_Internal
    Lambda_ENI_B -.->|Protected by| SG_Lambda_Internet
    Lambda_ENI_B -.->|Protected by| SG_Lambda_Internal
    Fargate_A -.->|Protected by| SG_Fargate
    Fargate_B -.->|Protected by| SG_Fargate
    Interface_Endpoints_A -.->|Protected by| SG_VPC_Endpoints
    Interface_Endpoints_B -.->|Protected by| SG_VPC_Endpoints
    OpenSearch_A -.->|Protected by| SG_OpenSearch
    OpenSearch_B -.->|Protected by| SG_OpenSearch

    %% Styling
    classDef public fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef private fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef gateway fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef interface fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef security fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef compute fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px

    class PublicSubnetA,PublicSubnetB,NAT_GW_A,NAT_GW_B public
    class PrivateSubnetA,PrivateSubnetB,Lambda_ENI_A,Lambda_ENI_B,Fargate_A,Fargate_B,OpenSearch_A,OpenSearch_B private
    class S3_GW,DDB_GW gateway
    class VPCE_Secrets_A,VPCE_SQS_A,VPCE_States_A,VPCE_ECR_API_A,VPCE_ECR_DKR_A,VPCE_Logs_A,VPCE_ES_A,VPCE_Secrets_B,VPCE_SQS_B,VPCE_States_B,VPCE_ECR_API_B,VPCE_ECR_DKR_B,VPCE_Logs_B,VPCE_ES_B interface
    class SG_Lambda_Internet,SG_Lambda_Internal,SG_Fargate,SG_VPC_Endpoints,SG_OpenSearch security
    class Lambda_Internet,Lambda_Internal compute
```

## Network Architecture Overview

This diagram shows the complete VPC network architecture with all deployed VPC endpoints, security group relationships, and traffic routing patterns.

### Key Components

#### VPC Endpoints

**Gateway Endpoints** (Route Table Integration):
- **S3 Gateway Endpoint**: Provides private access to S3 buckets without internet routing
- **DynamoDB Gateway Endpoint**: Provides private access to DynamoDB tables without internet routing
- Both endpoints are integrated with private route tables to automatically route S3/DynamoDB traffic

**Interface Endpoints** (ENI-based with Security Groups):
- **Secrets Manager**: Private access to application secrets and database credentials
- **SQS**: Private access to message queues for asynchronous processing
- **Step Functions (states)**: Private access to workflow orchestration service
- **ECR API**: Private access to container registry API for image management
- **ECR Docker (dkr)**: Private access to Docker registry for image pulls
- **CloudWatch Logs**: Private access to centralized logging service
- **OpenSearch (es)**: Private access to managed OpenSearch service for search functionality

#### Security Group Rules

**VPC Endpoints Security Group**:
- **Ingress**: Port 443 (HTTPS) from Lambda Internet SG, Lambda Internal SG, and Fargate SG
- **Purpose**: Controls access to all Interface VPC Endpoints

**Lambda Security Groups**:
- **Lambda Internet SG**: 
  - Egress to VPC Endpoints (port 443)
  - Egress to Internet (port 443) for web scraping
  - Egress to OpenSearch (port 443)
- **Lambda Internal SG**:
  - Egress to VPC Endpoints (port 443)
  - Egress to OpenSearch (port 443)
  - No internet access

**Fargate Security Group**:
- **Egress**: Port 443 to VPC Endpoints for AWS service access
- **Purpose**: Enables Fargate tasks to access AWS services privately

**OpenSearch Security Group**:
- **Ingress**: Port 443 from both Lambda security groups
- **Purpose**: Controls access to OpenSearch cluster within VPC

### Traffic Routing Patterns

#### Internet-bound Traffic
- Lambda functions with internet access route through NAT Gateways
- Used for web scraping and external API calls
- Routes: Private Subnet → NAT Gateway → Internet Gateway → Internet

#### AWS Service Traffic via Gateway Endpoints
- S3 and DynamoDB traffic automatically routed through Gateway Endpoints
- No internet routing required, traffic stays within AWS backbone
- Routes: Compute Resources → Route Table → Gateway Endpoint → AWS Service

#### AWS Service Traffic via Interface Endpoints
- All other AWS services accessed through Interface VPC Endpoints
- Security groups control access between compute resources and endpoints
- Routes: Compute Resources → Interface Endpoint ENI → PrivateLink → AWS Service

#### Internal VPC Traffic
- OpenSearch cluster accessed directly within VPC
- Security groups control access between Lambda functions and OpenSearch
- Routes: Lambda ENI → OpenSearch Node (same VPC, different subnets)

### High Availability Design

- **Multi-AZ Deployment**: All components deployed across two Availability Zones
- **Redundant NAT Gateways**: Separate NAT Gateway in each AZ for internet access
- **Redundant VPC Endpoints**: Interface endpoints deployed in both AZs
- **Route Table Strategy**: 
  - Production: Separate route tables per AZ for high availability
  - Development: Single route table to reduce costs

### Security Considerations

- **Principle of Least Privilege**: Security groups only allow necessary traffic
- **Private Networking**: All compute resources in private subnets
- **VPC Endpoint Security**: Interface endpoints protected by dedicated security group
- **Network Segmentation**: Clear separation between public and private subnets
- **Traffic Isolation**: Gateway endpoints prevent S3/DynamoDB traffic from traversing internet