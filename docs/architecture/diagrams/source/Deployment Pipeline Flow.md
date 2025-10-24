### Deployment Pipeline Flow

graph TD
    START([Start Deployment]) --> VALIDATE{Validate<br/>Configuration}

    VALIDATE -->|Valid| PHASE1[Phase 1: Foundation]
    VALIDATE -->|Invalid| ERROR([Configuration Error])

    PHASE1 --> F01_DEPLOY[Deploy 01-foundation]
    F01_DEPLOY --> F03_DEPLOY[Deploy 03-audit-foundation]

    F03_DEPLOY --> PHASE2[Phase 2: Security & Networking]
    PHASE2 --> PARALLEL1{Deploy in Parallel}

    PARALLEL1 --> S04_DEPLOY[04-central-logging]
    PARALLEL1 --> S05_DEPLOY[05-networking]
    PARALLEL1 --> S06_DEPLOY[06-central-security]
    PARALLEL1 --> S07_DEPLOY[07-app-security]

    S04_DEPLOY --> SYNC1[Wait for Completion]
    S05_DEPLOY --> SYNC1
    S06_DEPLOY --> SYNC1
    S07_DEPLOY --> SYNC1

    SYNC1 --> PHASE3[Phase 3: Data & Storage]
    PHASE3 --> PARALLEL2{Deploy in Parallel}

    PARALLEL2 --> D08_DEPLOY[08-log-storage]
    PARALLEL2 --> D09_DEPLOY[09-app-storage]
    PARALLEL2 --> D10_DEPLOY[10-search]

    D08_DEPLOY --> SYNC2[Wait for Completion]
    D09_DEPLOY --> SYNC2
    D10_DEPLOY --> SYNC2

    SYNC2 --> PHASE4[Phase 4: Compute & API]
    PHASE4 --> C11_DEPLOY[11-iam]
    C11_DEPLOY --> C12_DEPLOY[12-compute]
    C12_DEPLOY --> C13_DEPLOY[13-api]

    C13_DEPLOY --> PHASE5[Phase 5: Operations]
    PHASE5 --> PARALLEL3{Deploy in Parallel}

    PARALLEL3 --> O14_DEPLOY[14-security-monitoring]
    PARALLEL3 --> O15_DEPLOY[15-app-monitoring]
    PARALLEL3 --> O16_DEPLOY[16-backup]
    PARALLEL3 --> O17_DEPLOY[17-governance]
    PARALLEL3 --> O19_DEPLOY[19-delivery]

    O14_DEPLOY --> COMPLETE([Deployment Complete])
    O15_DEPLOY --> COMPLETE
    O16_DEPLOY --> COMPLETE
    O17_DEPLOY --> COMPLETE
    O19_DEPLOY --> COMPLETE

    %% Styling
    classDef phase fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef deploy fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef control fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class PHASE1,PHASE2,PHASE3,PHASE4,PHASE5 phase
    class F01_DEPLOY,F03_DEPLOY,S04_DEPLOY,S05_DEPLOY,S06_DEPLOY,S07_DEPLOY,D08_DEPLOY,D09_DEPLOY,D10_DEPLOY,C11_DEPLOY,C12_DEPLOY,C13_DEPLOY,O14_DEPLOY,O15_DEPLOY,O16_DEPLOY,O17_DEPLOY,O19_DEPLOY deploy
    class VALIDATE,PARALLEL1,PARALLEL2,PARALLEL3,SYNC1,SYNC2 control
