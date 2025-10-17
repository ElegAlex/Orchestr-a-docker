# 🎨 Orchestr'A - Diagrammes d'Architecture & Modélisations

**Version :** 1.0
**Date :** Octobre 2025
**Format :** Mermaid Diagrams
**Compatible :** Obsidian, Mermaid Live Editor, GitHub

---

## 📋 Table des Matières

1. [Architecture Système](#architecture-système)
2. [Architecture Réseau](#architecture-réseau)
3. [Modèle de Données (ERD)](#modèle-de-données-erd)
4. [Flux Authentification](#flux-authentification)
5. [Flux CRUD Projets](#flux-crud-projets)
6. [Flux Upload Documents](#flux-upload-documents)
7. [Flux Notifications Temps Réel](#flux-notifications-temps-réel)
8. [Flux Gestion Congés](#flux-gestion-congés)
9. [Architecture Backend (NestJS)](#architecture-backend-nestjs)
10. [Architecture Frontend](#architecture-frontend)
11. [Pipeline CI/CD](#pipeline-cicd)
12. [Stratégie de Cache](#stratégie-de-cache)
13. [Migration Firebase → PostgreSQL](#migration-firebase--postgresql)
14. [Déploiement Docker](#déploiement-docker)
15. [Monitoring & Observabilité](#monitoring--observabilité)

---

## 1. Architecture Système

### 1.1 Vue d'Ensemble - Architecture Cible

```mermaid
graph TB
    subgraph Internet
        User[👤 Utilisateurs]
    end

    subgraph "DMZ / Edge"
        Traefik[🔀 Traefik<br/>Reverse Proxy<br/>Load Balancer]
    end

    subgraph "Application Layer"
        Frontend[⚛️ React Frontend<br/>SPA + Material-UI]
        API[🚀 NestJS API<br/>TypeScript Backend]
    end

    subgraph "Data Layer"
        Postgres[(🐘 PostgreSQL 16<br/>Primary Database)]
        Redis[(🔴 Redis 7<br/>Cache & Sessions)]
        MinIO[(📦 MinIO<br/>Object Storage)]
    end

    subgraph "Monitoring Layer"
        Prometheus[📊 Prometheus<br/>Metrics Collection]
        Grafana[📈 Grafana<br/>Dashboards]
        Loki[📝 Loki<br/>Log Aggregation]
    end

    User -->|HTTPS| Traefik
    Traefik -->|/| Frontend
    Traefik -->|/api| API
    Traefik -->|/grafana| Grafana

    Frontend -->|REST API| API
    Frontend -->|WebSocket| API

    API -->|SQL Queries| Postgres
    API -->|Cache Get/Set| Redis
    API -->|S3 API| MinIO
    API -->|Pub/Sub| Redis

    API -->|Metrics| Prometheus
    API -->|Logs| Loki
    Traefik -->|Metrics| Prometheus
    Postgres -->|Metrics| Prometheus

    Prometheus -->|Query| Grafana
    Loki -->|Query| Grafana

    style Traefik fill:#00ADD8,stroke:#00758F,stroke-width:2px,color:#fff
    style API fill:#E0234E,stroke:#B91C3A,stroke-width:2px,color:#fff
    style Frontend fill:#61DAFB,stroke:#21A1C4,stroke-width:2px,color:#000
    style Postgres fill:#336791,stroke:#1E4471,stroke-width:2px,color:#fff
    style Redis fill:#DC382D,stroke:#A82A22,stroke-width:2px,color:#fff
    style MinIO fill:#C72A3C,stroke:#9A1F2F,stroke-width:2px,color:#fff
```

### 1.2 Architecture Firebase (Actuelle)

```mermaid
graph TB
    subgraph Client
        ReactApp[⚛️ React App]
    end

    subgraph "Firebase (Google Cloud)"
        Auth[🔐 Firebase Auth]
        Firestore[(☁️ Cloud Firestore)]
        Storage[(📦 Cloud Storage)]
        Functions[⚡ Cloud Functions]
        Hosting[🌐 Firebase Hosting]
    end

    ReactApp -->|Firebase SDK| Auth
    ReactApp -->|Firebase SDK| Firestore
    ReactApp -->|Firebase SDK| Storage
    ReactApp -->|HTTPS Trigger| Functions

    Functions -->|Firestore API| Firestore
    Functions -->|Storage API| Storage

    Hosting -->|Serve| ReactApp

    style Auth fill:#FFA000,stroke:#F57C00,stroke-width:2px,color:#000
    style Firestore fill:#FFCA28,stroke:#FFA000,stroke-width:2px,color:#000
    style Storage fill:#FFCA28,stroke:#FFA000,stroke-width:2px,color:#000
    style Functions fill:#FFCA28,stroke:#FFA000,stroke-width:2px,color:#000
    style Hosting fill:#FFCA28,stroke:#FFA000,stroke-width:2px,color:#000
```

---

## 2. Architecture Réseau

### 2.1 Topologie Réseau Docker

```mermaid
graph TB
    subgraph "Host Machine (VPS)"
        subgraph "Docker Network: orchestr-a (172.25.0.0/16)"
            T[Traefik<br/>:80, :443]
            F[Frontend<br/>:3000]
            A[API<br/>:4000]
            P[PostgreSQL<br/>:5432]
            R[Redis<br/>:6379]
            M[MinIO<br/>:9000, :9001]
            PR[Prometheus<br/>:9090]
            G[Grafana<br/>:3000]
            L[Loki<br/>:3100]
        end
    end

    Internet((🌐 Internet))

    Internet -->|80/443| T
    T -.->|Internal| F
    T -.->|Internal| A
    T -.->|Internal| M
    T -.->|Internal| PR
    T -.->|Internal| G

    A -.->|5432| P
    A -.->|6379| R
    A -.->|9000| M

    A -.->|Metrics| PR
    F -.->|Metrics| PR
    PR -.->|Query| G

    A -.->|Logs| L
    L -.->|Query| G

    style T fill:#00ADD8,stroke:#00758F,stroke-width:3px,color:#fff
    style Internet fill:#FF6B6B,stroke:#C92A2A,stroke-width:3px,color:#fff
```

### 2.2 Flux HTTPS avec Traefik

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant T as Traefik<br/>(Port 80/443)
    participant LE as Let's Encrypt
    participant F as Frontend
    participant A as API

    Note over U,A: Premier accès (HTTP)
    U->>T: HTTP Request<br/>http://orchestr-a.fr
    T->>T: Redirect to HTTPS
    T->>U: 301 Redirect<br/>https://orchestr-a.fr

    Note over U,A: Obtention certificat SSL
    U->>T: HTTPS Request (first time)
    T->>LE: ACME Challenge<br/>(HTTP-01)
    LE->>T: Validation + Certificate
    T->>T: Store cert in<br/>/letsencrypt/acme.json

    Note over U,A: Requêtes suivantes (HTTPS)
    U->>T: HTTPS Request<br/>https://orchestr-a.fr/
    T->>T: Terminate SSL
    T->>F: HTTP Request<br/>(internal)
    F->>T: HTML Response
    T->>U: HTTPS Response

    U->>T: HTTPS Request<br/>https://orchestr-a.fr/api/projects
    T->>T: Strip /api prefix
    T->>A: HTTP Request<br/>/projects (internal)
    A->>T: JSON Response
    T->>U: HTTPS Response
```

---

## 3. Modèle de Données (ERD)

### 3.1 Schéma Complet PostgreSQL

```mermaid
erDiagram
    User ||--o{ ProjectMember : "is member of"
    User ||--o{ Task : "assigned to"
    User ||--o{ Leave : "requests"
    User ||--o{ Notification : "receives"
    User ||--o{ Activity : "performs"
    User }o--|| Department : "belongs to"

    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ Task : "contains"
    Project ||--o{ Document : "has documents"
    Project ||--o{ Milestone : "has milestones"
    Project ||--o{ Activity : "tracks"

    Task ||--o{ Comment : "has comments"
    Task ||--o{ Document : "has attachments"
    Task ||--o{ Activity : "tracks"

    Department ||--o{ User : "contains"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        boolean isActive
        uuid departmentId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp lastLoginAt
    }

    Project {
        uuid id PK
        string name
        text description
        enum status
        enum priority
        decimal budget
        date startDate
        date dueDate
        uuid managerId FK
        jsonb metadata
        string[] tags
        timestamp createdAt
        timestamp updatedAt
    }

    ProjectMember {
        uuid id PK
        uuid projectId FK
        uuid userId FK
        string role
        timestamp joinedAt
    }

    Task {
        uuid id PK
        string title
        text description
        enum status
        enum priority
        uuid projectId FK
        uuid assigneeId FK
        int estimatedHours
        int actualHours
        date dueDate
        timestamp completedAt
        string[] dependencies
        string[] tags
        jsonb metadata
        timestamp createdAt
        timestamp updatedAt
    }

    Leave {
        uuid id PK
        uuid userId FK
        enum type
        enum status
        date startDate
        date endDate
        decimal days
        text reason
        uuid approverId FK
        timestamp approvedAt
        timestamp createdAt
        timestamp updatedAt
    }

    Document {
        uuid id PK
        string name
        string originalName
        string type
        bigint size
        string storagePath
        uuid projectId FK
        uuid taskId FK
        uuid uploadedBy FK
        boolean isPublic
        jsonb metadata
        string[] tags
        timestamp uploadedAt
    }

    Notification {
        uuid id PK
        uuid userId FK
        enum type
        string title
        text message
        boolean isRead
        timestamp readAt
        string resourceType
        uuid resourceId
        jsonb metadata
        timestamp createdAt
    }

    Activity {
        uuid id PK
        uuid userId FK
        string action
        string resource
        uuid resourceId
        uuid projectId FK
        uuid taskId FK
        string status
        text error
        int duration
        jsonb metadata
        timestamp timestamp
    }

    Department {
        uuid id PK
        string name
        string code UK
        uuid managerId FK
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    Comment {
        uuid id PK
        uuid taskId FK
        uuid userId FK
        text content
        timestamp createdAt
        timestamp updatedAt
    }

    Milestone {
        uuid id PK
        uuid projectId FK
        string name
        text description
        date dueDate
        enum status
        timestamp createdAt
        timestamp updatedAt
    }
```

### 3.2 Relations Clés

```mermaid
graph LR
    subgraph "Core Entities"
        U[User]
        P[Project]
        T[Task]
    end

    subgraph "HR Entities"
        L[Leave]
        D[Department]
    end

    subgraph "Support Entities"
        Doc[Document]
        N[Notification]
        A[Activity]
        C[Comment]
    end

    U -->|manages| P
    U -->|member of| P
    U -->|assigned to| T
    U -->|requests| L
    U -->|belongs to| D
    U -->|receives| N
    U -->|creates| A

    P -->|contains| T
    P -->|has| Doc
    P -->|tracks| A

    T -->|has| C
    T -->|has| Doc
    T -->|tracks| A

    D -->|manages| U

    style U fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P fill:#7B68EE,stroke:#4B3A9E,stroke-width:2px,color:#fff
    style T fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
```

---

## 4. Flux Authentification

### 4.1 Login avec Email/Password

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API<br/>(NestJS)
    participant P as PostgreSQL
    participant R as Redis

    U->>F: Enter email/password
    F->>A: POST /api/auth/login<br/>{email, password}

    A->>A: Validate DTO<br/>(class-validator)

    A->>P: SELECT user<br/>WHERE email = ?
    P->>A: User record

    A->>A: bcrypt.compare()<br/>password vs hash

    alt Password correct
        A->>A: Generate JWT<br/>accessToken (15min)<br/>refreshToken (30d)
        A->>R: SETEX refresh_token<br/>userId, 30days
        A->>P: UPDATE users<br/>SET lastLoginAt
        A->>F: 200 OK<br/>{accessToken, refreshToken, user}
        F->>F: Store tokens<br/>localStorage
        F->>U: Redirect to /dashboard
    else Password incorrect
        A->>F: 401 Unauthorized<br/>{message: "Invalid credentials"}
        F->>U: Show error
    end
```

### 4.2 Refresh Token Flow

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant R as Redis

    Note over F,R: Access token expiré (401)

    F->>A: GET /api/projects<br/>Authorization: Bearer {expired_token}
    A->>A: JWT verify fails
    A->>F: 401 Unauthorized

    F->>F: Detect 401<br/>Check refreshToken exists

    F->>A: POST /api/auth/refresh<br/>{refreshToken}
    A->>A: Verify refresh token signature
    A->>R: GET refresh_token:{userId}
    R->>A: Token valid

    alt Refresh token valid
        A->>A: Generate new accessToken
        A->>F: 200 OK<br/>{accessToken}
        F->>F: Update localStorage

        F->>A: Retry original request<br/>GET /api/projects<br/>Authorization: Bearer {new_token}
        A->>F: 200 OK<br/>[projects]
    else Refresh token invalid/expired
        A->>F: 401 Unauthorized
        F->>F: Clear tokens<br/>Redirect to /login
    end
```

### 4.3 OAuth2 Google

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API
    participant G as Google OAuth2
    participant P as PostgreSQL

    U->>F: Click "Sign in with Google"
    F->>A: GET /api/auth/google
    A->>G: Redirect to<br/>accounts.google.com/o/oauth2/auth

    G->>U: Google Login Page
    U->>G: Enter credentials
    G->>G: User authenticates

    G->>A: Callback<br/>/api/auth/google/callback?code=xyz
    A->>G: POST /token<br/>Exchange code for tokens
    G->>A: {access_token, id_token}

    A->>G: GET /userinfo<br/>Authorization: Bearer {token}
    G->>A: {email, name, picture}

    A->>P: SELECT user<br/>WHERE email = ?

    alt User exists
        P->>A: User record
    else User doesn't exist
        A->>P: INSERT INTO users<br/>(email, firstName, lastName)
        P->>A: New user record
    end

    A->>A: Generate JWT tokens
    A->>F: Redirect to /dashboard?token=xyz
    F->>F: Extract & store tokens
    F->>U: Show dashboard
```

---

## 5. Flux CRUD Projets

### 5.1 Création Projet

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API
    participant C as Cache (Redis)
    participant P as PostgreSQL
    participant N as Notifications

    U->>F: Click "New Project"
    F->>U: Show form
    U->>F: Fill form + Submit

    F->>A: POST /api/projects<br/>Authorization: Bearer {token}<br/>{name, description, ...}

    A->>A: @UseGuards(JwtAuthGuard)<br/>Extract user from token
    A->>A: @ValidateBody(CreateProjectDto)<br/>Validate data

    A->>P: BEGIN TRANSACTION

    A->>P: INSERT INTO projects<br/>(name, description, managerId, ...)
    P->>A: Project created (id: uuid)

    A->>P: INSERT INTO project_members<br/>(projectId, userId, role='manager')
    P->>A: Member added

    A->>P: INSERT INTO activities<br/>(action='project.created', ...)
    P->>A: Activity logged

    A->>P: COMMIT TRANSACTION

    A->>C: DEL projects:{userId}:*<br/>Invalidate cache

    A->>N: Emit event<br/>project.created
    N->>N: Notify team members

    A->>F: 201 Created<br/>{id, name, ...}
    F->>U: Show success + redirect
```

### 5.2 Lecture Projets (avec Cache)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant C as Cache (Redis)
    participant P as PostgreSQL

    F->>A: GET /api/projects<br/>Authorization: Bearer {token}

    A->>A: Extract userId + role<br/>from JWT

    A->>C: GET projects:{userId}:{role}

    alt Cache HIT
        C->>A: [cached projects]
        A->>F: 200 OK<br/>[projects]
        Note over F,P: 🚀 Response time: ~10ms
    else Cache MISS
        C->>A: null

        alt User is Admin/Responsable
            A->>P: SELECT * FROM projects<br/>LEFT JOIN project_members<br/>WHERE 1=1
        else User is Regular
            A->>P: SELECT * FROM projects<br/>LEFT JOIN project_members<br/>WHERE project_members.userId = ?
        end

        P->>A: [projects with members, tasks count, ...]

        A->>C: SETEX projects:{userId}:{role}<br/>300 seconds<br/>[projects]

        A->>F: 200 OK<br/>[projects]
        Note over F,P: ⏱️ Response time: ~50ms
    end
```

### 5.3 Mise à Jour Projet

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API
    participant G as Guards
    participant C as Cache
    participant P as PostgreSQL
    participant E as Events

    F->>A: PATCH /api/projects/{id}<br/>{name: "Updated name"}

    A->>G: @UseGuards(JwtAuthGuard)
    G->>A: ✅ User authenticated

    A->>G: @UseGuards(ProjectMemberGuard)
    G->>P: Check if user is project member
    P->>G: ✅ User is member
    G->>A: ✅ Access granted

    A->>P: UPDATE projects<br/>SET name = ?, updatedAt = NOW()<br/>WHERE id = ?
    P->>A: 1 row updated

    A->>P: SELECT * FROM projects<br/>WHERE id = ?
    P->>A: Updated project

    A->>C: DEL projects:{userId}:*<br/>DEL project:{id}

    A->>E: Emit 'project.updated'<br/>{projectId, changes}
    E->>E: Notify members<br/>via WebSocket

    A->>P: INSERT INTO activities<br/>(action='project.updated', ...)

    A->>F: 200 OK<br/>{updated project}
```

---

## 6. Flux Upload Documents

### 6.1 Upload vers MinIO

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API
    participant M as MinIO
    participant P as PostgreSQL

    U->>F: Select file + Upload
    F->>F: Validate file<br/>size < 50MB<br/>type allowed

    F->>A: POST /api/documents/upload<br/>Content-Type: multipart/form-data<br/>file: [binary]<br/>projectId: uuid

    A->>A: @UseInterceptors(FileInterceptor)<br/>Parse multipart

    A->>A: Generate unique filename<br/>uuid.pdf

    A->>M: putObject()<br/>bucket: 'documents'<br/>key: '{projectId}/{uuid}.pdf'<br/>buffer: [file content]<br/>metadata: {contentType, uploadedBy}

    M->>M: Store file on disk<br/>/data/documents/...
    M->>A: ✅ Upload complete<br/>ETag: "abc123"

    A->>P: INSERT INTO documents<br/>(name, originalName, type, size,<br/>storagePath, projectId, uploadedBy)
    P->>A: Document record created

    A->>F: 201 Created<br/>{id, name, url: '/api/documents/{id}/download', ...}

    F->>U: Show success<br/>Display document in list
```

### 6.2 Download avec URL Signée

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant A as API
    participant M as MinIO
    participant P as PostgreSQL

    U->>F: Click download button

    F->>A: GET /api/documents/{id}/download

    A->>A: @UseGuards(JwtAuthGuard)<br/>Check authentication

    A->>P: SELECT * FROM documents<br/>WHERE id = ?
    P->>A: {storagePath, projectId, ...}

    A->>P: Check permissions<br/>Is user project member?
    P->>A: ✅ Access granted

    A->>M: presignedGetObject()<br/>bucket: 'documents'<br/>key: storagePath<br/>expires: 15 minutes
    M->>A: Signed URL<br/>https://minio:9000/documents/...<br/>?X-Amz-Signature=xyz&expires=...

    A->>F: 200 OK<br/>{url: "signed URL"}

    F->>U: Redirect to signed URL<br/>(or download via fetch)

    U->>M: GET {signed URL}
    M->>M: Verify signature<br/>Check expiration
    M->>U: 200 OK<br/>Content-Type: application/pdf<br/>[file content]
```

---

## 7. Flux Notifications Temps Réel

### 7.1 Architecture WebSocket + Redis Pub/Sub

```mermaid
graph TB
    subgraph "Clients (Browsers)"
        C1[👤 User 1<br/>WebSocket]
        C2[👤 User 2<br/>WebSocket]
        C3[👤 User 3<br/>WebSocket]
    end

    subgraph "API Instances (Scalable)"
        API1[NestJS API #1<br/>NotificationsGateway]
        API2[NestJS API #2<br/>NotificationsGateway]
    end

    subgraph "Message Broker"
        Redis[(Redis Pub/Sub<br/>Channel: notifications)]
    end

    subgraph "Services"
        PS[ProjectsService]
        TS[TasksService]
        LS[LeavesService]
    end

    C1 -.WebSocket.-> API1
    C2 -.WebSocket.-> API1
    C3 -.WebSocket.-> API2

    PS -->|Emit event| Redis
    TS -->|Emit event| Redis
    LS -->|Emit event| Redis

    Redis -->|Subscribe| API1
    Redis -->|Subscribe| API2

    API1 -.->|Send to room<br/>user:123| C1
    API1 -.->|Send to room<br/>user:456| C2
    API2 -.->|Send to room<br/>user:789| C3

    style Redis fill:#DC382D,stroke:#A82A22,stroke-width:2px,color:#fff
    style API1 fill:#E0234E,stroke:#B91C3A,stroke-width:2px,color:#fff
    style API2 fill:#E0234E,stroke:#B91C3A,stroke-width:2px,color:#fff
```

### 7.2 Séquence Notification Temps Réel

```mermaid
sequenceDiagram
    participant U1 as 👤 User 1<br/>(Manager)
    participant U2 as 👤 User 2<br/>(Team Member)
    participant F1 as Frontend 1
    participant F2 as Frontend 2
    participant API as API Instance
    participant R as Redis Pub/Sub
    participant P as PostgreSQL

    Note over U2,F2: User 2 connects WebSocket
    F2->>API: WebSocket connect<br/>auth: {token}
    API->>API: Verify JWT<br/>Extract userId
    API->>API: client.join('user:456')
    API->>P: SELECT notifications<br/>WHERE userId=456 AND isRead=false
    P->>API: [unread notifications]
    API->>F2: Emit 'unread_notifications'<br/>[array]
    F2->>U2: Display badge (3 unread)

    Note over U1,P: User 1 assigns task to User 2
    U1->>F1: Assign task to User 2
    F1->>API: POST /api/tasks<br/>{assigneeId: 456, ...}

    API->>P: INSERT INTO tasks<br/>(assigneeId=456, ...)
    P->>API: Task created

    API->>P: INSERT INTO notifications<br/>(userId=456, type='TASK_ASSIGNED', ...)
    P->>API: Notification created

    API->>R: PUBLISH notifications<br/>{userId: 456, type: 'TASK_ASSIGNED', ...}
    R->>API: Message received

    API->>API: Find client in room<br/>'user:456'
    API->>F2: WebSocket emit<br/>'notification'<br/>{type, title, message}

    F2->>U2: 🔔 Toast notification<br/>"New task assigned"
    F2->>F2: Update badge (4 unread)
    F2->>F2: Play sound
```

---

## 8. Flux Gestion Congés

### 8.1 Demande de Congé

```mermaid
sequenceDiagram
    participant E as 👤 Employee
    participant F as Frontend
    participant A as API
    participant P as PostgreSQL
    participant M as 👨‍💼 Manager
    participant N as Notifications

    E->>F: Request leave<br/>{startDate, endDate, type}

    F->>A: POST /api/leaves<br/>{startDate, endDate, type, reason}

    A->>P: SELECT leave_balance<br/>WHERE userId = ? AND type = ?
    P->>A: {available: 15 days}

    A->>A: Calculate days<br/>requested: 5 days

    alt Sufficient balance
        A->>P: Check overlapping leaves<br/>WHERE userId = ? AND dates overlap
        P->>A: No overlap

        A->>P: INSERT INTO leaves<br/>(userId, type, startDate, endDate, status='PENDING')
        P->>A: Leave created

        A->>P: SELECT manager_id<br/>FROM users<br/>WHERE id = ?
        P->>A: Manager ID

        A->>N: Create notification<br/>for manager
        N->>M: 🔔 "New leave request"

        A->>F: 201 Created<br/>{leave record}
        F->>E: ✅ "Leave request submitted"
    else Insufficient balance
        A->>F: 400 Bad Request<br/>"Insufficient leave balance"
        F->>E: ❌ Show error
    end
```

### 8.2 Approbation de Congé

```mermaid
stateDiagram-v2
    [*] --> PENDING: Employee submits

    PENDING --> APPROVED: Manager approves
    PENDING --> REJECTED: Manager rejects
    PENDING --> CANCELLED: Employee cancels

    APPROVED --> CANCELLED: Employee cancels<br/>(before start date)

    REJECTED --> [*]
    CANCELLED --> [*]
    APPROVED --> [*]: After end date

    note right of PENDING
        Notifications sent to:
        - Manager (approval needed)
    end note

    note right of APPROVED
        Actions:
        - Update leave balance
        - Notify employee
        - Update calendar
    end note

    note right of REJECTED
        Actions:
        - Notify employee
        - Log reason
    end note
```

---

## 9. Architecture Backend (NestJS)

### 9.1 Structure Modulaire

```mermaid
graph TB
    subgraph "App Module (Root)"
        AM[app.module.ts]
    end

    subgraph "Core Modules"
        Auth[AuthModule<br/>JWT + Passport]
        Users[UsersModule<br/>CRUD + Roles]
        Config[ConfigModule<br/>Environment]
    end

    subgraph "Feature Modules"
        Projects[ProjectsModule]
        Tasks[TasksModule]
        Leaves[LeavesModule]
        Docs[DocumentsModule]
        Notifs[NotificationsModule<br/>+ Gateway WebSocket]
    end

    subgraph "Shared Modules"
        Prisma[PrismaModule<br/>Database]
        Cache[CacheModule<br/>Redis]
        MinioM[MinioModule<br/>Storage]
        Events[EventsModule<br/>EventEmitter]
    end

    subgraph "Common"
        Guards[Guards<br/>JwtAuth, Roles, ...]
        Pipes[Pipes<br/>Validation]
        Interceptors[Interceptors<br/>Transform, Audit, ...]
        Filters[Filters<br/>Exception handling]
    end

    AM --> Auth
    AM --> Users
    AM --> Config
    AM --> Projects
    AM --> Tasks
    AM --> Leaves
    AM --> Docs
    AM --> Notifs

    Auth --> Prisma
    Auth --> Cache

    Projects --> Prisma
    Projects --> Cache
    Projects --> Events

    Tasks --> Prisma
    Tasks --> Events

    Leaves --> Prisma
    Leaves --> Events

    Docs --> Prisma
    Docs --> MinioM

    Notifs --> Prisma
    Notifs --> Cache
    Notifs --> Events

    Projects --> Guards
    Tasks --> Guards
    Leaves --> Guards

    style AM fill:#E0234E,stroke:#B91C3A,stroke-width:3px,color:#fff
    style Prisma fill:#2D3748,stroke:#1A202C,stroke-width:2px,color:#fff
    style Cache fill:#DC382D,stroke:#A82A22,stroke-width:2px,color:#fff
```

### 9.2 Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant G as Guards
    participant I as Interceptors
    participant P as Pipes
    participant H as Route Handler
    participant S as Service
    participant DB as Database

    C->>M: HTTP Request

    Note over M: Express Middleware
    M->>M: CORS<br/>Rate Limiting<br/>Body Parser

    M->>G: Next

    Note over G: Guards (Validation)
    G->>G: JwtAuthGuard<br/>Verify token
    G->>G: RolesGuard<br/>Check permissions

    alt Unauthorized
        G->>C: 401/403 Response
    else Authorized
        G->>I: Next
    end

    Note over I: Interceptors (Before)
    I->>I: Logging<br/>Transform request

    I->>P: Next

    Note over P: Pipes (Validation)
    P->>P: ValidationPipe<br/>Transform DTO

    alt Validation fails
        P->>C: 400 Bad Request
    else Valid
        P->>H: Next
    end

    Note over H: Route Handler (Controller)
    H->>S: Call service method

    S->>DB: Execute query
    DB->>S: Result

    S->>H: Return data

    H->>I: Return response

    Note over I: Interceptors (After)
    I->>I: Transform response<br/>Add metadata

    I->>C: HTTP Response
```

### 9.3 Module Internal Structure

```mermaid
classDiagram
    class ProjectsModule {
        +imports: [PrismaModule, CacheModule]
        +controllers: [ProjectsController]
        +providers: [ProjectsService]
        +exports: [ProjectsService]
    }

    class ProjectsController {
        -projectsService: ProjectsService
        +findAll(userId: string): Promise~Project[]~
        +findOne(id: string): Promise~Project~
        +create(dto: CreateProjectDto): Promise~Project~
        +update(id: string, dto: UpdateProjectDto): Promise~Project~
        +delete(id: string): Promise~void~
    }

    class ProjectsService {
        -prisma: PrismaService
        -cache: CacheManager
        -events: EventEmitter2
        +findAll(userId: string, role: Role): Promise~Project[]~
        +findOne(id: string): Promise~Project~
        +create(userId: string, dto: CreateProjectDto): Promise~Project~
        +update(id: string, dto: UpdateProjectDto): Promise~Project~
        +delete(id: string): Promise~void~
        -checkAccess(projectId: string, userId: string): Promise~void~
        -invalidateCache(userId: string): Promise~void~
    }

    class CreateProjectDto {
        +name: string
        +description?: string
        +status: ProjectStatus
        +priority: Priority
        +startDate: Date
        +dueDate: Date
        +budget?: number
        +tags?: string[]
    }

    class UpdateProjectDto {
        +name?: string
        +description?: string
        +status?: ProjectStatus
        +priority?: Priority
        +dueDate?: Date
        +budget?: number
    }

    ProjectsModule --> ProjectsController
    ProjectsModule --> ProjectsService
    ProjectsController --> ProjectsService
    ProjectsController --> CreateProjectDto
    ProjectsController --> UpdateProjectDto
    ProjectsService --> CreateProjectDto
    ProjectsService --> UpdateProjectDto
```

---

## 10. Architecture Frontend

### 10.1 Structure React

```mermaid
graph TB
    subgraph "App Root"
        App[App.tsx<br/>Router + Auth]
    end

    subgraph "Layouts"
        MainLayout[MainLayout<br/>Sidebar + Header]
        AuthLayout[AuthLayout<br/>Centered]
    end

    subgraph "Pages"
        Dashboard[Dashboard<br/>KPIs + Charts]
        Projects[Projects<br/>List + Grid]
        Tasks[Tasks<br/>Kanban + List]
        Calendar[Calendar<br/>Events + Leaves]
        Settings[Settings<br/>Profile + Preferences]
    end

    subgraph "Components"
        ProjectCard[ProjectCard]
        TaskCard[TaskCard]
        UserAvatar[UserAvatar]
        NotificationBell[NotificationBell]
        FileUpload[FileUpload]
    end

    subgraph "API Layer"
        APIClient[APIClient<br/>Axios + Interceptors]
        Auth[auth.ts]
        ProjectsAPI[projects.ts]
        TasksAPI[tasks.ts]
        WS[WebSocket<br/>Socket.IO]
    end

    subgraph "State Management"
        Redux[Redux Store]
        AuthSlice[authSlice]
        ProjectsSlice[projectsSlice]
        TasksSlice[tasksSlice]
        NotifsSlice[notificationsSlice]
    end

    subgraph "Hooks"
        useAuth[useAuth]
        useProjects[useProjects]
        useTasks[useTasks]
        useNotifications[useNotifications<br/>+ WebSocket]
    end

    App --> MainLayout
    App --> AuthLayout

    MainLayout --> Dashboard
    MainLayout --> Projects
    MainLayout --> Tasks
    MainLayout --> Calendar
    MainLayout --> Settings

    Dashboard --> ProjectCard
    Dashboard --> NotificationBell

    Projects --> ProjectCard
    Projects --> FileUpload

    Tasks --> TaskCard

    ProjectCard --> useProjects
    TaskCard --> useTasks
    NotificationBell --> useNotifications

    useProjects --> ProjectsAPI
    useTasks --> TasksAPI
    useNotifications --> WS

    ProjectsAPI --> APIClient
    TasksAPI --> APIClient
    Auth --> APIClient

    useAuth --> Redux
    useProjects --> Redux
    useTasks --> Redux
    useNotifications --> Redux

    Redux --> AuthSlice
    Redux --> ProjectsSlice
    Redux --> TasksSlice
    Redux --> NotifsSlice

    style App fill:#61DAFB,stroke:#21A1C4,stroke-width:3px,color:#000
    style Redux fill:#764ABC,stroke:#5A2A8C,stroke-width:2px,color:#fff
    style APIClient fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
```

### 10.2 State Flow (Redux Toolkit)

```mermaid
sequenceDiagram
    participant C as Component
    participant H as Hook (useProjects)
    participant S as Redux Store
    participant A as Async Thunk
    participant API as API Client
    participant B as Backend

    C->>H: useProjects()
    H->>S: useSelector(state => state.projects)
    S->>H: {projects, loading, error}
    H->>C: Return state

    Note over C,B: User action
    C->>H: dispatch(fetchProjects())
    H->>S: dispatch(thunk)

    S->>A: Execute async thunk
    A->>S: Set loading=true

    A->>API: apiClient.projects.getAll()
    API->>B: GET /api/projects
    B->>API: 200 OK [projects]
    API->>A: Return data

    A->>S: dispatch(projectsSlice/fulfilled)<br/>{projects: data}
    S->>S: Update state<br/>loading=false, projects=[...]

    S->>H: State changed
    H->>C: Re-render with new data
```

---

## 11. Pipeline CI/CD

### 11.1 GitHub Actions Workflow

```mermaid
graph TB
    subgraph "Trigger Events"
        Push[git push<br/>main/develop]
        PR[Pull Request]
    end

    subgraph "CI Pipeline"
        Checkout[Checkout Code]
        SetupNode[Setup Node.js 18]
        InstallDeps[npm ci]
        Lint[npm run lint]
        TypeCheck[npx tsc --noEmit]
        Tests[npm test]
        Coverage[Upload Coverage<br/>Codecov]
    end

    subgraph "Build Stage"
        BuildBackend[Build Backend<br/>Docker Image]
        BuildFrontend[Build Frontend<br/>Docker Image]
        Push2Registry[Push to Registry<br/>GHCR/DockerHub]
    end

    subgraph "Deploy Stage (main only)"
        SSHConnect[SSH to VPS]
        PullImages[docker-compose pull]
        Migrate[Run Migrations<br/>prisma migrate deploy]
        Deploy[docker-compose up -d]
        HealthCheck[Health Checks]
        Rollback[Rollback if fail]
    end

    Push --> Checkout
    PR --> Checkout

    Checkout --> SetupNode
    SetupNode --> InstallDeps
    InstallDeps --> Lint
    Lint --> TypeCheck
    TypeCheck --> Tests
    Tests --> Coverage

    Coverage -->|✅ All pass| BuildBackend
    Coverage -->|❌ Fail| Stop[❌ Stop]

    BuildBackend --> BuildFrontend
    BuildFrontend --> Push2Registry

    Push2Registry -->|main branch| SSHConnect
    Push2Registry -->|other branch| End[End]

    SSHConnect --> PullImages
    PullImages --> Migrate
    Migrate --> Deploy
    Deploy --> HealthCheck

    HealthCheck -->|✅ Healthy| Success[✅ Deployment Success]
    HealthCheck -->|❌ Unhealthy| Rollback
    Rollback --> Fail[❌ Deployment Failed]

    style Push fill:#28A745,stroke:#1E7E34,stroke-width:2px,color:#fff
    style Stop fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
    style Success fill:#28A745,stroke:#1E7E34,stroke-width:2px,color:#fff
    style Fail fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
```

### 11.2 Deployment Strategy (Blue-Green)

```mermaid
graph LR
    subgraph "Users"
        U[👥 Traffic]
    end

    subgraph "Load Balancer"
        LB[Traefik]
    end

    subgraph "Current (Blue)"
        Blue1[API v1.0<br/>Container 1]
        Blue2[API v1.0<br/>Container 2]
    end

    subgraph "New (Green)"
        Green1[API v1.1<br/>Container 1]
        Green2[API v1.1<br/>Container 2]
    end

    U -->|100%| LB
    LB -.->|Active| Blue1
    LB -.->|Active| Blue2

    Green1 -.->|Standby| LB
    Green2 -.->|Standby| LB

    style Blue1 fill:#3B82F6,stroke:#1E40AF,stroke-width:2px,color:#fff
    style Blue2 fill:#3B82F6,stroke:#1E40AF,stroke-width:2px,color:#fff
    style Green1 fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style Green2 fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
```

**After switch:**

```mermaid
graph LR
    subgraph "Users"
        U[👥 Traffic]
    end

    subgraph "Load Balancer"
        LB[Traefik]
    end

    subgraph "Old (Blue)"
        Blue1[API v1.0<br/>Container 1]
        Blue2[API v1.0<br/>Container 2]
    end

    subgraph "Current (Green)"
        Green1[API v1.1<br/>Container 1]
        Green2[API v1.1<br/>Container 2]
    end

    U -->|100%| LB
    LB -.->|Active| Green1
    LB -.->|Active| Green2

    Blue1 -.->|Terminated| LB
    Blue2 -.->|Terminated| LB

    style Blue1 fill:#3B82F6,stroke:#1E40AF,stroke-width:2px,color:#fff,stroke-dasharray: 5 5,opacity:0.5
    style Blue2 fill:#3B82F6,stroke:#1E40AF,stroke-width:2px,color:#fff,stroke-dasharray: 5 5,opacity:0.5
    style Green1 fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
    style Green2 fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
```

---

## 12. Stratégie de Cache

### 12.1 Hiérarchie de Cache

```mermaid
graph TB
    subgraph "Client-Side"
        Browser[Browser Cache<br/>HTTP Cache-Control]
        LocalStorage[localStorage<br/>JWT Tokens]
    end

    subgraph "CDN Layer (Traefik)"
        StaticCache[Static Assets Cache<br/>JS, CSS, Images<br/>max-age=31536000]
    end

    subgraph "Application Layer (Redis)"
        L1[L1 Cache<br/>Hot data<br/>TTL: 5min]
        L2[L2 Cache<br/>Warm data<br/>TTL: 30min]
    end

    subgraph "Database"
        PG[(PostgreSQL<br/>Source of Truth)]
    end

    Client[👤 User] -->|Request| Browser
    Browser -->|Cache miss| StaticCache
    StaticCache -->|Cache miss| L1
    L1 -->|Cache miss| L2
    L2 -->|Cache miss| PG

    PG -->|Write back| L2
    L2 -->|Write back| L1
    L1 -->|Response| StaticCache
    StaticCache -->|Response| Browser
    Browser -->|Display| Client

    style Browser fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
    style L1 fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style L2 fill:#FF8C42,stroke:#D9631E,stroke-width:2px,color:#fff
    style PG fill:#336791,stroke:#1E4471,stroke-width:2px,color:#fff
```

### 12.2 Cache Invalidation

```mermaid
flowchart TD
    Write[Write Operation<br/>POST/PATCH/DELETE] --> Detect{Detect Resource Type}

    Detect -->|User| User[Invalidate:<br/>user:{id}<br/>users:*]
    Detect -->|Project| Project[Invalidate:<br/>project:{id}<br/>projects:{userId}:*<br/>dashboard:*]
    Detect -->|Task| Task[Invalidate:<br/>task:{id}<br/>tasks:project:{projectId}<br/>projects:{userId}:*]

    User --> Redis[(Redis<br/>DEL commands)]
    Project --> Redis
    Task --> Redis

    Redis --> NextRead[Next Read:<br/>Cache MISS]
    NextRead --> DB[(PostgreSQL<br/>Fresh Data)]
    DB --> UpdateCache[Update Cache<br/>with new TTL]
    UpdateCache --> Response[Return to Client]

    style Write fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style Redis fill:#DC382D,stroke:#A82A22,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#1E4471,stroke-width:2px,color:#fff
```

---

## 13. Migration Firebase → PostgreSQL

### 13.1 Processus Global

```mermaid
graph TB
    subgraph "Phase 1: Export"
        FS[(Firebase<br/>Firestore)]
        Export[Export Script<br/>Node.js + Admin SDK]
        JSON[JSON Files<br/>30+ collections]

        FS -->|Read all documents| Export
        Export -->|Write to disk| JSON
    end

    subgraph "Phase 2: Transform"
        JSON -->|Read| Transform[Transform Script<br/>Data Mapping]
        Transform -->|Convert types| Mapped[Mapped Data<br/>Firestore → PostgreSQL]

        Transform -.->|Timestamps → ISO| Mapped
        Transform -.->|Enums → UPPERCASE| Mapped
        Transform -.->|Relations → FK| Mapped
    end

    subgraph "Phase 3: Import"
        Mapped -->|Load| Import[Import Script<br/>Prisma Client]
        Import -->|Bulk insert| PG[(PostgreSQL)]
        Import -->|Validate| Validate[Validation<br/>Row counts<br/>FK integrity]
    end

    subgraph "Phase 4: Verification"
        Validate -->|Compare| Compare{Counts Match?}
        Compare -->|✅ Yes| Success[✅ Migration Success]
        Compare -->|❌ No| Fail[❌ Investigation<br/>Retry]
    end

    style FS fill:#FFCA28,stroke:#FFA000,stroke-width:2px,color:#000
    style PG fill:#336791,stroke:#1E4471,stroke-width:2px,color:#fff
    style Success fill:#28A745,stroke:#1E7E34,stroke-width:2px,color:#fff
    style Fail fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
```

### 13.2 Mapping Données Firestore → PostgreSQL

```mermaid
classDiagram
    class FirestoreUser {
        string id
        string email
        string displayName
        string role (lowercase)
        Timestamp createdAt
        Timestamp updatedAt
        map~string,any~ customData
    }

    class PostgreSQLUser {
        uuid id
        string email
        string firstName
        string lastName
        enum role (UPPERCASE)
        timestamp createdAt
        timestamp updatedAt
        jsonb metadata
    }

    FirestoreUser --|> PostgreSQLUser : Transform

    note for PostgreSQLUser "Transformations:\n1. displayName → firstName + lastName\n2. role: 'admin' → 'ADMIN'\n3. Timestamp → Date ISO\n4. customData → metadata JSONB"
```

### 13.3 Timeline Migration

```mermaid
gantt
    title Migration Timeline (12 weeks)
    dateFormat  YYYY-MM-DD
    section Phase 0: Prep
    Setup Dev Env           :p0, 2025-10-14, 5d
    NestJS Init            :p0b, after p0, 3d
    Docker Compose         :p0c, after p0b, 2d

    section Phase 1: Core
    Auth Module            :p1a, 2025-10-24, 7d
    Users Module           :p1b, after p1a, 7d
    Projects Module        :p1c, after p1b, 7d
    Tasks Module           :p1d, after p1c, 7d

    section Phase 2: Features
    Leaves Module          :p2a, 2025-11-21, 7d
    Documents Module       :p2b, after p2a, 7d
    Notifications Module   :p2c, after p2b, 7d

    section Phase 3: Frontend
    API Client Layer       :p3a, 2025-12-12, 7d
    Service Migration      :p3b, after p3a, 7d

    section Phase 4: Data
    Export Firestore       :p4a, 2025-12-26, 3d
    Import PostgreSQL      :p4b, after p4a, 4d

    section Phase 5: Deploy
    Load Testing           :p5a, 2026-01-02, 5d
    Production Deploy      :p5b, after p5a, 5d
```

---

## 14. Déploiement Docker

### 14.1 Architecture Containers

```mermaid
graph TB
    subgraph "Docker Host (VPS)"
        subgraph "Network: orchestr-a"
            subgraph "Proxy"
                Traefik[Traefik<br/>traefik:v2.10]
            end

            subgraph "Application"
                Frontend[Frontend<br/>nginx:alpine]
                API1[API Instance #1<br/>orchestr-a/api:latest]
                API2[API Instance #2<br/>orchestr-a/api:latest]
            end

            subgraph "Data"
                PG[PostgreSQL<br/>postgres:16-alpine]
                Redis[Redis<br/>redis:7-alpine]
                MinIO[MinIO<br/>minio/minio:latest]
            end

            subgraph "Monitoring"
                Prom[Prometheus<br/>prom/prometheus:latest]
                Graf[Grafana<br/>grafana/grafana:latest]
                Loki[Loki<br/>grafana/loki:latest]
            end
        end

        subgraph "Volumes"
            PGData[(postgres-data)]
            RedisData[(redis-data)]
            MinioData[(minio-data)]
            PromData[(prometheus-data)]
            GrafData[(grafana-data)]
        end
    end

    Internet((Internet)) -->|80/443| Traefik

    Traefik --> Frontend
    Traefik --> API1
    Traefik --> API2
    Traefik --> Graf

    API1 --> PG
    API1 --> Redis
    API1 --> MinIO
    API2 --> PG
    API2 --> Redis
    API2 --> MinIO

    API1 --> Prom
    API2 --> Prom
    Traefik --> Prom

    PG --> PGData
    Redis --> RedisData
    MinIO --> MinioData
    Prom --> PromData
    Graf --> GrafData

    style Traefik fill:#00ADD8,stroke:#00758F,stroke-width:2px,color:#fff
    style PG fill:#336791,stroke:#1E4471,stroke-width:2px,color:#fff
    style Redis fill:#DC382D,stroke:#A82A22,stroke-width:2px,color:#fff
    style MinIO fill:#C72A3C,stroke:#9A1F2F,stroke-width:2px,color:#fff
```

### 14.2 Container Dependencies

```mermaid
graph TD
    Start([docker-compose up]) --> Traefik
    Start --> PG
    Start --> Redis
    Start --> MinIO

    PG -->|healthy| API
    Redis -->|healthy| API
    MinIO -->|healthy| API

    API -->|running| Frontend

    Traefik --> Ready{All Services Ready?}
    Frontend --> Ready
    API --> Ready

    Ready -->|✅ Yes| Success[✅ Stack Running<br/>Access: https://orchestr-a.fr]
    Ready -->|❌ No| Fail[❌ Check logs<br/>docker-compose logs]

    style Start fill:#28A745,stroke:#1E7E34,stroke-width:2px,color:#fff
    style Success fill:#28A745,stroke:#1E7E34,stroke-width:2px,color:#fff
    style Fail fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
```

---

## 15. Monitoring & Observabilité

### 15.1 Architecture Monitoring

```mermaid
graph TB
    subgraph "Sources de Métriques"
        API[NestJS API<br/>/metrics endpoint]
        Traefik[Traefik<br/>/metrics endpoint]
        PG[PostgreSQL<br/>postgres_exporter]
        Redis[Redis<br/>redis_exporter]
        MinIO[MinIO<br/>/minio/v2/metrics]
        Node[Node Exporter<br/>System metrics]
    end

    subgraph "Collection & Storage"
        Prometheus[Prometheus<br/>TSDB]
    end

    subgraph "Visualization"
        Grafana[Grafana<br/>Dashboards]
    end

    subgraph "Alerting"
        AlertManager[AlertManager<br/>Notifications]
        Email[📧 Email]
        Slack[💬 Slack]
    end

    API -->|Scrape /metrics<br/>every 15s| Prometheus
    Traefik -->|Scrape| Prometheus
    PG -->|Scrape| Prometheus
    Redis -->|Scrape| Prometheus
    MinIO -->|Scrape| Prometheus
    Node -->|Scrape| Prometheus

    Prometheus -->|Query| Grafana
    Prometheus -->|Rules evaluation| AlertManager

    AlertManager -->|Send| Email
    AlertManager -->|Send| Slack

    style Prometheus fill:#E6522C,stroke:#B7412A,stroke-width:2px,color:#fff
    style Grafana fill:#F46800,stroke:#C55400,stroke-width:2px,color:#fff
```

### 15.2 Dashboards Grafana

```mermaid
graph TB
    subgraph "Overview Dashboard"
        D1[System Metrics<br/>CPU, RAM, Disk, Network]
        D2[HTTP Requests<br/>Rate, Latency, Errors]
        D3[Database<br/>Connections, Queries/s, Slow queries]
        D4[Cache<br/>Hit ratio, Memory usage]
    end

    subgraph "Application Dashboard"
        D5[API Endpoints<br/>Top routes, Response times]
        D6[Business Metrics<br/>Users, Projects, Tasks]
        D7[Errors<br/>4xx, 5xx by endpoint]
    end

    subgraph "Alerting Rules"
        A1[🚨 CPU > 80%]
        A2[🚨 Memory > 90%]
        A3[🚨 Disk > 85%]
        A4[🚨 API p95 latency > 500ms]
        A5[🚨 Error rate > 1%]
        A6[🚨 PostgreSQL down]
    end

    Prometheus[(Prometheus)] --> D1
    Prometheus --> D2
    Prometheus --> D3
    Prometheus --> D4
    Prometheus --> D5
    Prometheus --> D6
    Prometheus --> D7

    Prometheus --> A1
    Prometheus --> A2
    Prometheus --> A3
    Prometheus --> A4
    Prometheus --> A5
    Prometheus --> A6

    style A1 fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
    style A2 fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
    style A3 fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
    style A4 fill:#FFC107,stroke:#FFA000,stroke-width:2px,color:#000
    style A5 fill:#FFC107,stroke:#FFA000,stroke-width:2px,color:#000
    style A6 fill:#DC3545,stroke:#A71D2A,stroke-width:2px,color:#fff
```

### 15.3 Logs Aggregation (Loki)

```mermaid
graph TB
    subgraph "Log Sources"
        API[API Logs<br/>Winston/Pino]
        Nginx[Nginx Access Logs]
        PG[PostgreSQL Logs]
        Docker[Docker Container Logs]
    end

    subgraph "Collection"
        Promtail[Promtail<br/>Log Shipper]
    end

    subgraph "Storage & Query"
        Loki[Loki<br/>Log Aggregation]
    end

    subgraph "Visualization"
        Grafana[Grafana<br/>Explore Logs]
    end

    API -->|stdout/stderr| Docker
    Nginx -->|stdout| Docker
    PG -->|stdout| Docker

    Docker -->|Collect| Promtail
    Promtail -->|Push| Loki

    Loki -->|Query| Grafana

    Grafana -->|LogQL queries| Loki

    style Loki fill:#F46800,stroke:#C55400,stroke-width:2px,color:#fff
    style Grafana fill:#F46800,stroke:#C55400,stroke-width:2px,color:#fff
```

---

## 🎯 Conclusion

Ce document contient **toutes les modélisations architecturales et flux** nécessaires pour comprendre et implémenter la migration d'Orchestr'A vers une stack open-source.

### Utilisation

**Visualisation avec Obsidian :**
1. Copier ce fichier dans votre vault Obsidian
2. Installer le plugin "Mermaid" si nécessaire
3. Les diagrammes s'afficheront automatiquement

**Visualisation avec Mermaid Live Editor :**
1. Aller sur https://mermaid.live
2. Copier/coller n'importe quel bloc Mermaid
3. Le diagramme s'affiche instantanément

**Visualisation sur GitHub :**
- Les diagrammes Mermaid sont nativement supportés dans les fichiers Markdown

### Diagrammes Disponibles

✅ **15 catégories** de diagrammes :
- Architecture système (4 diagrammes)
- Réseau (2 diagrammes)
- Base de données ERD (2 diagrammes)
- Flux métier (12 diagrammes de séquence)
- Modules backend (3 diagrammes)
- Frontend React (2 diagrammes)
- CI/CD (2 diagrammes)
- Cache (2 diagrammes)
- Migration (3 diagrammes)
- Docker (2 diagrammes)
- Monitoring (3 diagrammes)

**Total : 38+ diagrammes professionnels** 🎨

---

**Document version 1.0 - Octobre 2025**
**Auteur : Claude Code AI**
**Format : Mermaid v10+**
