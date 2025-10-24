## The Fragmented Discovery Problem

graph TB
    subgraph "Current Fragmented Ecosystem"
        subgraph "Client Pain Points 👩‍🎨"
            CP1["🔍 Ineffective Search<br/>Instagram search fails for local discovery"]
            CP2["📱 Platform Jumping<br/>Google Maps → Studio Sites → Instagram → Repeat"]
            CP3["⏰ Time Consuming<br/>Weeks of manual research per tattoo"]
            CP4["❓ Incomplete Information<br/>Missing artists with poor web presence"]
            CP5["🎯 Style Mismatch<br/>Chronological feeds don't show style range"]
        end
        
        subgraph "Artist Pain Points 🎨"
            AP1["📈 Marketing Burden<br/>Time spent on promotion vs. art creation"]
            AP2["👻 Invisible Talent<br/>Great artists with poor online presence"]
            AP3["💬 Disorganized Inquiries<br/>DMs mixed with casual interactions"]
            AP4["🎪 Algorithm Dependency<br/>Chronological feeds hide style diversity"]
            AP5["🎯 Targeting Issues<br/>Reaching serious clients vs. casual browsers"]
        end
        
        subgraph "Existing Solutions - Walled Gardens 🏰"
            WG1["📝 Opt-in Only<br/>Incomplete artist databases"]
            WG2["💰 Pay-to-Play<br/>Featured artists ≠ best match"]
            WG3["🔒 Proprietary Systems<br/>Disrupts artist workflows"]
            WG4["🌍 Geographic Gaps<br/>Poor coverage outside major cities"]
        end
    end
    
    subgraph "Data Sources - Scattered & Inefficient 📊"
        DS1["🗺️ Google Maps<br/>Studio locations only"]
        DS2["🌐 Studio Websites<br/>Often outdated or incomplete"]
        DS3["📱 Instagram<br/>Poor search & discovery tools"]
        DS4["📞 Word of Mouth<br/>Limited reach & scalability"]
    end
    
    subgraph "The Core Problem 💔"
        PROB["🔗 FRAGMENTED ECOSYSTEM<br/><br/>• No single source of truth<br/>• Manual, time-intensive process<br/>• Incomplete artist coverage<br/>• Misaligned incentives<br/>• Poor user experience for both sides"]
    end
    
    %% Client journey connections
    CP1 --> DS3
    CP2 --> DS1
    CP2 --> DS2
    CP2 --> DS3
    CP3 --> DS4
    CP4 --> AP2
    CP5 --> AP4
    
    %% Artist challenges
    AP1 --> DS3
    AP2 --> CP4
    AP3 --> DS3
    AP4 --> CP5
    AP5 --> WG2
    
    %% Existing solutions fail
    WG1 --> AP2
    WG2 --> CP5
    WG3 --> AP1
    WG4 --> CP4
    
    %% All lead to core problem
    CP1 --> PROB
    CP2 --> PROB
    AP1 --> PROB
    AP2 --> PROB
    WG1 --> PROB
    WG2 --> PROB
    DS1 --> PROB
    DS3 --> PROB
    
    %% Styling
    classDef clientPain fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef artistPain fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef walledGarden fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef dataSource fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef coreProblem fill:#fce4ec,stroke:#e91e63,stroke-width:3px
    
    class CP1,CP2,CP3,CP4,CP5 clientPain
    class AP1,AP2,AP3,AP4,AP5 artistPain
    class WG1,WG2,WG3,WG4 walledGarden
    class DS1,DS2,DS3,DS4 dataSource
    class PROB coreProblem