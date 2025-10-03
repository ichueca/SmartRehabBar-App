# Diagramas de Arquitectura - SmartRehabBar

Este documento contiene los diagramas visuales de la arquitectura del sistema en formato Mermaid.

---

## 1. Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "Plataformas (Hardware)"
        PL[Plataforma Izquierda<br/>ESP32 + Sensor]
        PR[Plataforma Derecha<br/>ESP32 + Sensor]
    end
    
    subgraph "Heroku Dyno"
        subgraph "Backend (Node.js + Express)"
            API[API REST<br/>Endpoints]
            MS[MeasurementService<br/>Sincronización]
            SS[SessionService<br/>Gestión Sesiones]
            SOCK[Socket.IO Server<br/>Tiempo Real]
            API --> MS
            API --> SS
            MS --> SOCK
            SS --> SOCK
        end
        
        DB[(PostgreSQL<br/>Database)]
        
        subgraph "Frontend (React SPA)"
            PM[PatientManager<br/>Gestión Pacientes]
            SC[SessionControl<br/>Control Sesiones]
            DASH[Dashboard<br/>Visualización]
            PM --> SC
            SC --> DASH
        end
        
        MS --> DB
        SS --> DB
        SOCK -.WebSocket.-> DASH
        PM -.HTTP.-> API
        SC -.HTTP.-> API
    end
    
    subgraph "Simulador (Testing)"
        SIM[Platform Simulator<br/>Escenarios de Prueba]
    end
    
    PL -.HTTP POST.-> API
    PR -.HTTP POST.-> API
    SIM -.HTTP POST.-> API
    
    USER[Usuario/Terapeuta] --> PM
    USER --> SC
    USER --> DASH
    
    style PL fill:#e1f5ff
    style PR fill:#e1f5ff
    style API fill:#fff4e6
    style MS fill:#fff4e6
    style SS fill:#fff4e6
    style SOCK fill:#fff4e6
    style DB fill:#f3e5f5
    style PM fill:#e8f5e9
    style SC fill:#e8f5e9
    style DASH fill:#e8f5e9
    style SIM fill:#fce4ec
```

---

## 2. Flujo de Datos - Captura de Mediciones

```mermaid
sequenceDiagram
    participant PL as Plataforma Izq
    participant PR as Plataforma Der
    participant API as API REST
    participant MS as MeasurementService
    participant DB as PostgreSQL
    participant SOCK as Socket.IO
    participant FE as Frontend

    Note over PL,PR: Usuario pisa plataformas
    
    PL->>API: POST /api/measurements/left<br/>{weight: 65.5, timestamp: T1}
    API->>MS: Procesar medición izquierda
    MS->>MS: Agregar a buffer temporal
    
    PR->>API: POST /api/measurements/right<br/>{weight: 68.2, timestamp: T1+200ms}
    API->>MS: Procesar medición derecha
    MS->>MS: Buscar pareja en buffer
    
    alt Mediciones dentro de ventana (3 seg)
        MS->>MS: Emparejar mediciones
        MS->>MS: Calcular balance (48.9% / 51.1%)
        MS->>DB: Guardar ambas mediciones
        MS->>SOCK: Emitir 'measurement:new'<br/>{left, right, balance}
        SOCK->>FE: Broadcast evento
        FE->>FE: Actualizar dashboard
    else Timeout (sin pareja)
        MS->>DB: Guardar medición individual
        MS->>SOCK: Emitir 'measurement:new'<br/>{unpaired: true}
        SOCK->>FE: Broadcast evento
        FE->>FE: Mostrar medición individual
    end
```

---

## 3. Flujo de Gestión de Sesiones

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant API as API REST
    participant SS as SessionService
    participant DB as PostgreSQL
    participant SOCK as Socket.IO

    U->>FE: Seleccionar paciente
    FE->>FE: Guardar en Context
    
    U->>FE: Click "Iniciar Sesión"
    FE->>API: POST /api/sessions<br/>{patientId: 1}
    API->>SS: Crear sesión
    SS->>DB: INSERT session<br/>(start_time = NOW)
    DB-->>SS: session_id = 1
    SS->>SOCK: Emitir 'session:started'
    SS-->>API: {sessionId: 1, startTime}
    API-->>FE: Respuesta exitosa
    FE->>FE: Actualizar estado<br/>Mostrar timer y contador
    SOCK->>FE: Broadcast evento
    
    Note over U,FE: Usuario camina sobre plataformas<br/>Mediciones se capturan...
    
    U->>FE: Click "Finalizar Sesión"
    FE->>API: PATCH /api/sessions/1
    API->>SS: Finalizar sesión
    SS->>DB: UPDATE session<br/>(end_time = NOW)
    SS->>SS: Calcular estadísticas
    SS->>SOCK: Emitir 'session:ended'<br/>{statistics}
    SS-->>API: {endTime, statistics}
    API-->>FE: Respuesta con resumen
    FE->>FE: Mostrar modal con resultados
    SOCK->>FE: Broadcast evento
```

---

## 4. Arquitectura de Componentes Frontend

```mermaid
graph TD
    APP[App.jsx<br/>Router + Context Provider]
    
    APP --> PM[PatientManager.jsx]
    APP --> DASH[Dashboard.jsx]
    
    PM --> PFORM[Formulario Crear Paciente]
    PM --> PLIST[Lista de Pacientes]
    
    DASH --> SC[SessionControl.jsx]
    DASH --> WI[WeightIndicators.jsx]
    DASH --> FV[FeetVisualization.jsx]
    DASH --> BC[BalanceChart.jsx]
    
    SC --> TIMER[Timer Component]
    SC --> COUNTER[Counter Component]
    
    subgraph "Hooks Personalizados"
        USOCK[useSocket]
        USESS[useSession]
        UMEAS[useMeasurements]
    end
    
    subgraph "Services"
        APIS[api.js<br/>REST Client]
        SOCKS[socket.js<br/>Socket.IO Client]
    end
    
    DASH --> USOCK
    DASH --> USESS
    DASH --> UMEAS
    
    USOCK --> SOCKS
    PM --> APIS
    SC --> APIS
    
    style APP fill:#e3f2fd
    style PM fill:#f3e5f5
    style DASH fill:#e8f5e9
    style USOCK fill:#fff3e0
    style USESS fill:#fff3e0
    style UMEAS fill:#fff3e0
    style APIS fill:#fce4ec
    style SOCKS fill:#fce4ec
```

---

## 5. Esquema de Base de Datos

```mermaid
erDiagram
    PATIENT ||--o{ SESSION : "tiene"
    SESSION ||--o{ MEASUREMENT : "contiene"
    MEASUREMENT ||--o| MEASUREMENT : "emparejada con"
    
    PATIENT {
        int id PK
        string name
        datetime created_at
    }
    
    SESSION {
        int id PK
        int patient_id FK
        datetime start_time
        datetime end_time
        string notes
    }
    
    MEASUREMENT {
        int id PK
        int session_id FK
        string foot
        float weight
        int duration
        datetime timestamp
        int paired_measurement_id FK
    }
```

---

## 6. Flujo de Sincronización de Mediciones

```mermaid
flowchart TD
    START([Medición Recibida])
    START --> VALID{¿Datos válidos?}
    
    VALID -->|No| ERROR[Retornar Error 400]
    VALID -->|Sí| BUFFER[Agregar a Buffer Temporal]
    
    BUFFER --> SEARCH{¿Existe medición<br/>del otro pie?}
    
    SEARCH -->|Sí| CHECK_TIME{¿Dentro de<br/>ventana 3 seg?}
    
    CHECK_TIME -->|Sí| PAIR[Emparejar Mediciones]
    PAIR --> CALC[Calcular Balance]
    CALC --> SAVE_PAIR[Guardar Ambas en DB]
    SAVE_PAIR --> EMIT_PAIR[Emitir Socket.IO<br/>measurement:new paired]
    EMIT_PAIR --> END([Fin])
    
    CHECK_TIME -->|No| TIMEOUT
    SEARCH -->|No| WAIT[Esperar Timeout]
    WAIT --> TIMEOUT{¿Timeout 3 seg?}
    
    TIMEOUT -->|Sí| SAVE_SINGLE[Guardar Individual en DB]
    SAVE_SINGLE --> EMIT_SINGLE[Emitir Socket.IO<br/>measurement:new unpaired]
    EMIT_SINGLE --> END
    
    TIMEOUT -->|No| WAIT
    
    style START fill:#e8f5e9
    style ERROR fill:#ffebee
    style PAIR fill:#e3f2fd
    style CALC fill:#e3f2fd
    style EMIT_PAIR fill:#f3e5f5
    style EMIT_SINGLE fill:#fff3e0
    style END fill:#e8f5e9
```

---

## 7. Despliegue en Heroku

```mermaid
graph LR
    subgraph "Desarrollo Local"
        DEV[Código Fuente]
        GIT[Git Repository]
    end
    
    subgraph "Heroku Platform"
        BUILD[Build Process]
        DYNO[Web Dyno<br/>Node.js App]
        PGADDON[PostgreSQL Addon]
    end
    
    subgraph "Usuarios"
        BROWSER[Navegador Web]
        SIM[Simulador]
    end
    
    DEV --> GIT
    GIT -->|git push heroku main| BUILD
    BUILD -->|heroku-postbuild| BUILD1[npm install backend]
    BUILD1 --> BUILD2[npm install frontend]
    BUILD2 --> BUILD3[npm run build frontend]
    BUILD3 --> BUILD4[npx prisma migrate deploy]
    BUILD4 --> DYNO
    
    DYNO <--> PGADDON
    
    BROWSER <-->|HTTPS| DYNO
    SIM <-->|HTTPS| DYNO
    
    style DEV fill:#e8f5e9
    style BUILD fill:#fff3e0
    style DYNO fill:#e3f2fd
    style PGADDON fill:#f3e5f5
    style BROWSER fill:#fce4ec
    style SIM fill:#fce4ec
```

---

## 8. Fases de Implementación

```mermaid
gantt
    title Plan de Implementación MVP SmartRehabBar
    dateFormat  YYYY-MM-DD
    section Configuración
    FASE 1: Configuración Inicial           :f1, 2025-01-01, 3h
    FASE 2: Base de Datos                   :f2, after f1, 2h
    section Backend
    FASE 3: API REST                        :f3, after f2, 5h
    FASE 4: Lógica de Negocio              :f4, after f3, 5h
    FASE 5: Socket.IO                       :f5, after f4, 3h
    section Frontend
    FASE 6: Configuración Frontend          :f6, after f1, 3h
    FASE 7: Servicios y Hooks              :f7, after f6, 4h
    FASE 8: Gestión Pacientes              :f8, after f7, 3h
    FASE 9: Control Sesiones               :f9, after f8, 3h
    FASE 10: Dashboard                      :f10, after f9, 6h
    section Testing
    FASE 11: Simulador                      :f11, after f5, 3h
    FASE 12: Testing y Validación          :f12, after f10, 4h
    section Despliegue
    FASE 13: Config Heroku                  :f13, after f12, 3h
    FASE 14: Despliegue                     :f14, after f13, 2h
    FASE 15: Documentación                  :f15, after f14, 3h
```

---

## Cómo Visualizar los Diagramas

### En VS Code
1. Instalar extensión "Markdown Preview Mermaid Support"
2. Abrir este archivo
3. Presionar `Ctrl+Shift+V` (o `Cmd+Shift+V` en Mac)

### En GitHub
Los diagramas Mermaid se renderizan automáticamente en GitHub

### Online
Copiar el código Mermaid y pegarlo en: https://mermaid.live/

---

**Documento creado:** 2025-10-03  
**Versión:** 1.0  
**Autor:** Equipo SmartRehabBar

