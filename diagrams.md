# UML Diagram — Simulasi Federated Learning (Flower + NumPy)

## 1. Use Case Diagram

```mermaid
flowchart TD

    User((Pengguna / Admin))

    subgraph Sistem["Aplikasi Simulasi Federated Learning"]
        UC1[Jalankan Simulasi]
        UC2[Lihat Dashboard]
        UC3[Lihat Metrik Global]
        UC4[Lihat Status Klien]
        UC5[Lihat Log Interaksi]
        UC6[Berhenti Simulasi]
        UC7[Reset Simulasi]

        UC8[Distribusi Model Global]
        UC9[Pelatihan Lokal]
        UC10[Kirim Update Klien]
        UC11[Agregasi FedAvg]
        UC12[Evaluasi Model Global]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7

    UC1 --> UC8
    UC8 --> UC9
    UC9 --> UC10
    UC10 --> UC11
    UC11 --> UC12

    UC12 --> UC3
    UC10 --> UC5
    UC11 --> UC5
```

---

## 2. Activity Diagram

```mermaid
flowchart TD

    Start((Mulai))

    A[Buka Dashboard]
    B{Klik Mulai Simulasi?}
    C[Inisialisasi Server dan 3 Klien]
    D[Distribusi Model Global]
    E[Pelatihan Model Lokal]
    F[Kirim Update dari Klien]
    G[Agregasi Parameter dengan FedAvg]
    H[Evaluasi Model Global]
    I[Perbarui Metrik dan Log]
    J{Masih ada ronde?}
    K[Masuk ke Ronde Berikutnya]
    L[Simulasi Selesai]
    M((Selesai))

    Start --> A
    A --> B
    B -->|Ya| C
    B -->|Tidak| A

    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J

    J -->|Ya| K
    K --> D

    J -->|Tidak| L
    L --> M
```

---

## 3. State Machine Diagram

```mermaid
stateDiagram-v2

    [*] --> Idle

    Idle --> Initializing : klik Mulai Simulasi
    Initializing --> Running : server dan 3 klien siap

    state Running {
        [*] --> Distributing

        Distributing --> Training : model global diterima klien
        Training --> Uploading : pelatihan lokal selesai
        Uploading --> Aggregating : update 3 klien diterima
        Aggregating --> Evaluating : FedAvg selesai
        Evaluating --> UpdatingDashboard : evaluasi selesai
        UpdatingDashboard --> NextRound : masih ada ronde
        NextRound --> Distributing
    }

    Running --> Stopped : klik Berhenti
    Running --> Completed : ronde terakhir selesai

    Stopped --> Idle : reset
    Completed --> Idle : reset

    Idle --> [*]
```

---

## 4. Class Diagram

```mermaid
classDiagram

    class Dashboard {
        +startSimulation()
        +stopSimulation()
        +resetSimulation()
        +updateMetrics()
        +updateLog()
        +updateRound()
    }

    class SimulationController {
        -currentRound: int
        -totalRounds: int
        -status: string
        +start()
        +stop()
        +reset()
        +runRound()
    }

    class ServerApp {
        -strategy: FedAvg
        -globalModel: Model
        +distributeModel()
        +aggregateUpdates()
        +evaluateGlobalModel()
    }

    class FlowerClient {
        -cid: string
        -model: Model
        -active: bool
        +receiveModel()
        +trainLocalModel()
        +sendUpdate()
        +evaluate()
    }

    class Model {
        -W: ndarray
        -b: float
        +initialize()
        +train()
        +predict()
        +evaluate()
    }

    class FedAvg {
        -minFitClients: int
        -fractionFit: float
        +aggregate()
    }

    class RoundResult {
        -roundNumber: int
        -globalLoss: float
        -globalAccuracy: float
        -activeClients: int
        +saveResult()
    }

    class InteractionLog {
        -timestamp: datetime
        -message: string
        +addLog()
        +clearLog()
    }

    Dashboard --> SimulationController : mengendalikan
    SimulationController --> ServerApp : menjalankan
    SimulationController --> RoundResult : menghasilkan
    SimulationController --> InteractionLog : mencatat

    ServerApp --> FedAvg : menggunakan
    ServerApp --> Model : memiliki model global

    ServerApp --> FlowerClient : mengelola 3 klien
    FlowerClient --> Model : memiliki model lokal

    RoundResult --> Dashboard : ditampilkan
    InteractionLog --> Dashboard : ditampilkan
```

---

## 5. Object Diagram

```mermaid
classDiagram

    class ServerInstance {
        <<instance>>
        server : ServerApp
        strategy : FedAvg
        status : "running"
        totalRounds : 5
    }

    class Client1 {
        <<instance>>
        client : FlowerClient
        cid : "1"
        active : true
    }

    class Client2 {
        <<instance>>
        client : FlowerClient
        cid : "2"
        active : true
    }

    class Client3 {
        <<instance>>
        client : FlowerClient
        cid : "3"
        active : true
    }

    class GlobalModel {
        <<instance>>
        model : Model
        W : ndarray
        b : 0.0
    }

    class DashboardInstance {
        <<instance>>
        dashboard : Dashboard
        status : "Demo Mode"
        round : "1 / 5 / 5"
    }

    class ControllerInstance {
        <<instance>>
        controller : SimulationController
        currentRound : 1
        totalRounds : 5
    }

    class ResultInstance {
        <<instance>>
        result : RoundResult
        globalLoss : 0.3469
        globalAccuracy : 0.8870
        activeClients : "3 / 3"
    }

    DashboardInstance ..> ControllerInstance : mengendalikan
    ControllerInstance ..> ServerInstance : menjalankan

    ServerInstance ..> Client1 : mengelola
    ServerInstance ..> Client2 : mengelola
    ServerInstance ..> Client3 : mengelola

    ServerInstance ..> GlobalModel : menyimpan
    Client1 ..> GlobalModel : menerima model
    Client2 ..> GlobalModel : menerima model
    Client3 ..> GlobalModel : menerima model

    ControllerInstance ..> ResultInstance : menghasilkan
    ResultInstance ..> DashboardInstance : ditampilkan
```

---

## 6. Deployment Diagram

```mermaid
graph TB

    subgraph Laptop["Laptop Acer - Windows 10/11 - RAM 4 GB"]

        subgraph Python["Python 3.10 Environment"]

            subgraph Flower["Flower Simulation - flwr 1.30.0 + Ray 2.51.1"]

                Server["ServerApp<br/>FedAvg"]

                Client1["ClientApp Actor 1<br/>Klien 1"]

                Client2["ClientApp Actor 2<br/>Klien 2"]

                Client3["ClientApp Actor 3<br/>Klien 3"]

            end

            Controller["Simulation Controller"]

        end

        subgraph Browser["Web Browser"]

            Dashboard["Dashboard Visual<br/>localhost:8080"]

        end
    end

    Dashboard --> Controller

    Controller --> Server

    Server <--> Client1
    Server <--> Client2
    Server <--> Client3

    Server --> Dashboard
    Client1 --> Dashboard
    Client2 --> Dashboard
    Client3 --> Dashboard
```

---

## 7. Sequence Diagram

```mermaid
sequenceDiagram

    autonumber

    participant U as Pengguna
    participant D as Dashboard
    participant SC as Simulation Controller
    participant S as Server FedAvg
    participant C1 as Klien 1
    participant C2 as Klien 2
    participant C3 as Klien 3

    U->>D: Klik Mulai Simulasi
    D->>SC: start()
    SC->>S: Inisialisasi simulasi

    S->>C1: Distribusi model global
    S->>C2: Distribusi model global
    S->>C3: Distribusi model global

    C1->>C1: Pelatihan lokal
    C2->>C2: Pelatihan lokal
    C3->>C3: Pelatihan lokal

    C1->>S: Kirim update parameter
    C2->>S: Kirim update parameter
    C3->>S: Kirim update parameter

    S->>S: Agregasi FedAvg
    S->>S: Evaluasi model global

    S->>SC: Loss dan akurasi
    SC->>D: Update metrik dan log

    D->>U: Tampilkan hasil ronde

    alt Masih ada ronde
        SC->>S: Jalankan ronde berikutnya
    else Ronde terakhir
        SC->>D: Simulasi selesai
    end
```

---

## 8. Data Flow Diagram (DFD)

```mermaid
flowchart TD

    User[Pengguna / Admin]

    subgraph Dashboard["Dashboard Visual"]

        D1[Input Kontrol]
        D2[Tampilan Ronde]
        D3[Tampilan Metrik]
        D4[Tampilan Status Klien]
        D5[Log Interaksi]

    end

    subgraph Simulation["Proses Federated Learning"]

        P1[Inisialisasi Simulasi]
        P2[Distribusi Model Global]
        P3[Pelatihan Lokal]
        P4[Pengiriman Update]
        P5[Agregasi FedAvg]
        P6[Evaluasi Model Global]
        P7[Update Dashboard]

    end

    subgraph Data["Data Simulasi"]

        DS1[(Model Global)]
        DS2[(Parameter Klien)]
        DS3[(Hasil Evaluasi)]
        DS4[(Riwayat Ronde)]

    end

    User -->|Mulai / Berhenti / Reset| D1
    D1 --> P1

    P1 --> P2
    P2 -->|Model global| P3
    P3 -->|Parameter lokal| P4
    P4 --> DS2
    DS2 --> P5

    P5 -->|Model hasil agregasi| DS1
    DS1 --> P6

    P6 -->|Loss & Akurasi| DS3
    P6 -->|Hasil ronde| DS4

    DS3 --> P7
    DS4 --> P7

    P7 --> D2
    P7 --> D3
    P7 --> D4
    P7 --> D5

    D2 --> User
    D3 --> User
    D4 --> User
    D5 --> User
```

---

## 9. Entity Relationship Diagram (ERD)

```mermaid
erDiagram

    SIMULATION_RUN ||--o{ ROUND : memiliki
    ROUND ||--o{ CLIENT_RESULT : menghasilkan
    CLIENT ||--o{ CLIENT_RESULT : mengirim
    ROUND ||--|| GLOBAL_MODEL : menghasilkan
    GLOBAL_MODEL ||--o{ MODEL_PARAMETER : memiliki

    SIMULATION_RUN {
        string run_id PK
        datetime started_at
        int total_rounds
        string status
    }

    ROUND {
        int round_id PK
        string run_id FK
        int round_number
        string status
        datetime timestamp
    }

    CLIENT {
        string client_id PK
        string cid
        string status
    }

    CLIENT_RESULT {
        int result_id PK
        int round_id FK
        string client_id FK
        float loss
        float accuracy
        int num_samples
    }

    GLOBAL_MODEL {
        int model_id PK
        int round_id FK
        string version
    }

    MODEL_PARAMETER {
        int parameter_id PK
        int model_id FK
        string parameter_name
        string parameter_values
    }
```