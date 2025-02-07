# Tab Time Tracker - Simplified System Design Document

## 1. System Overview

### 1.1 Goals
- Support 100 daily active users
- Device-specific data storage
- Cross-browser compatibility (Chrome & Safari)
- Basic telemetry and analytics
- Zero to minimal infrastructure cost

### 1.2 Non-Goals
- User authentication
- Multi-device synchronization
- Real-time data analysis
- Premium features

## 2. Architecture Overview

### 2.1 System Components

#### Client (Browser Extension)
1. Core Components
   - Tab tracking module
   - Local storage manager
   - Stats calculator
   - Browser-specific adapters

2. Backend Services
   - Simple API server for telemetry
   - Basic analytics collector

### 2.2 Technical Stack

#### Version Control
- Git
- GitHub for repository hosting
- Branch Strategy:
  - main: production branch
  - develop: development branch
  - feature/*: feature branches
  - hotfix/*: urgent fixes

#### CI/CD
- GitHub Actions (free tier)
- Automated deployment to Render.com

#### Frontend (Extension)
- Language: TypeScript
- Framework: React 18
- UI Components:
  - TailwindCSS for styling
  - Recharts for data visualization
- State Management: React Hooks + Context
- Storage: Browser's local storage & IndexedDB
- Build System: Webpack

#### Backend (Minimal Server)
- Language: Python 3.11+
- Framework: FastAPI (modern, async)
- Database: SQLite (for telemetry data)
- API Documentation: Swagger/OpenAPI
- Type Safety: Pydantic models
- Hosting: Free tier options
  - Primary: Render.com free tier
  - Alternatives: Fly.io free tier or Railway starter plan

#### Monitoring
- OpenTelemetry for instrumentation
- Grafana Cloud free tier for visualization

## 3. Detailed Design

### 3.1 Data Flow
1. Local Data Flow:
   ```
   User Activity → In-Memory Buffer → IndexedDB → Local Stats
   ```

2. Telemetry Flow (Optional):
   ```
   Aggregated Stats → Daily Sync → Backend → Analytics
   ```

### 3.2 Data Storage

#### Local Storage Schema
```typescript
interface TabActivity {
    tabId: string;
    url: string;
    title: string;
    category: string;
    startTime: number;
    duration: number;
}

interface DailyStats {
    date: string;
    categories: {
        [category: string]: {
            totalTime: number;
            visitCount: number;
        }
    }
}
```

#### Server Storage (SQLite)
```sql
CREATE TABLE telemetry_events (
    id INTEGER PRIMARY KEY,
    device_id TEXT,
    event_type TEXT,
    data JSON,
    timestamp DATETIME
);
```

### 3.3 Browser Compatibility

#### Core Module Structure

```typescript
// types.ts
interface BrowserAdapter {
    trackTab(tabId: string): void;
    getActiveTab(): Promise<Tab>;
    onTabChange(callback: (tab: Tab) => void): void;
}

// hooks/useTabTracking.ts
const useTabTracking = (adapter: BrowserAdapter) => {
    const [activeTab, setActiveTab] = useState<Tab | null>(null);
    const [stats, setStats] = useState<TabStats>({});

    useEffect(() => {
        // Tab tracking logic
    }, [adapter]);

    return { activeTab, stats };
};

// components/StatsDisplay.tsx
interface StatsDisplayProps {
    data: TabStats;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ data }) => {
    return (
        <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transformStatsForChart(data)}>
                    {/* Chart configuration */}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
```

#### Browser-Specific Implementation
1. Chrome Extension:
   - Manifest V3 compatible
   - Service worker based
   - Chrome storage API

2. Safari Web Extension:
   - Safari extension bundle
   - Safari storage APIs
   - Background script adaptation

## 4. Free-Tier Infrastructure

### 4.1 Hosting Options

1. Frontend (Extension)
   - Chrome Web Store (free)
   - Safari App Store ($99/year Apple Developer Program - required)

2. Backend
   - Render.com free tier:
     - 750 hours/month
     - 512MB RAM
     - 0.1 CPU
     - SQLite storage (suitable for 100 DAU)

3. Monitoring
   - Grafana Cloud Free:
     - 10K series metrics
     - 14-day retention
     - 3 users
     - Basic alerting

### 4.2 Scaling Considerations
- Monitor free tier usage
- Implement request throttling
- Cache aggressive strategies
- Data retention policies

## 5. Implementation Phases

### Phase 1: Chrome Extension (1 month)
- React components setup
- Basic tracking functionality
- Local storage implementation
- Stats visualization with Recharts
- TailwindCSS styling implementation
- Chrome Web Store submission

### Phase 2: Telemetry (2 weeks)
- Backend server setup
- Basic analytics collection
- Monitoring setup

### Phase 3: Safari Support (1 month)
- Safari adapter implementation
- Testing and validation
- App Store submission

## 6. Technical Considerations

### 6.1 Storage Management
- Regular data cleanup (30 days retention)
- Compression for historical data
- Batch processing for analytics

### 6.2 Performance
- Efficient event batching
- Minimal server communication
- Aggressive local caching

### 6.3 Error Handling
- Offline capability
- Graceful degradation
- Basic error reporting

## 7. Future Considerations

### 7.1 Potential Enhancements
- Optional user accounts
- Data export feature
- Custom site categories
- Enhanced analytics

### 7.2 Scaling Triggers
- Monitor DAU growth
- Track storage usage
- Measure server load
- Consider paid tiers when:
  - DAU exceeds 80
  - Storage reaches 80% capacity
  - Response time exceeds 500ms
