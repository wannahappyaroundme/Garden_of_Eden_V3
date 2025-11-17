# v3.7.0 Planning: UI Enhancements for Tool Calling

**Date**: 2025-01-17
**Status**: Planning Phase
**Previous Version**: v3.6.0 (Tool Calling System & Frontend Integration)

---

## 🎯 Overview

v3.7.0 focuses on enhancing the user interface to visualize and control the tool calling system implemented in v3.6.0. Users should be able to see when tools are being used, understand what's happening, and configure tool behavior.

---

## ✨ Planned Features

### 1. Tool Call Visualization

**Goal**: Show users when and how the AI is using tools during conversations.

#### Features:
- **Tool Usage Indicator**: Inline badge showing "Using web_search..." during execution
- **Tool Result Display**: Collapsible card showing tool input/output
- **Multi-tool Timeline**: Visual timeline when AI uses multiple tools in sequence
- **Tool Execution Status**: Loading, success, error states

#### UI Components to Create:
- `ToolCallIndicator.tsx` - Badge component for active tool usage
- `ToolResultCard.tsx` - Expandable card showing tool details
- `ToolTimeline.tsx` - Sequential tool execution visualization
- `ToolStatusBadge.tsx` - Status indicator (loading/success/error)

#### Example UI:
```
[User] What's the weather in Seoul today?

[AI] Let me search for current weather information...
    🔧 Using web_search...
    ├─ Query: "Seoul weather today"
    ├─ Results: 5 links found
    └─ ✓ Completed in 2.3s

Based on the search results, the current weather in Seoul is...
```

---

### 2. Tool Configuration Settings

**Goal**: Give users control over which tools are enabled and how they behave.

#### Features:
- **Tools Settings Panel**: New tab in Settings page
- **Per-Tool Toggles**: Enable/disable individual tools
- **Tool Preferences**:
  - Web Search: Max results, search engine preference (DuckDuckGo/SearX)
  - File Operations: Allowed directories, read-only mode
  - System Info: Privacy level (minimal/full)
  - Calculator: Precision settings
- **Privacy Dashboard**: Show what data each tool can access
- **Tool Usage Analytics**: Statistics on tool usage frequency

#### UI Components to Create:
- `ToolsSettings.tsx` - Main settings page for tools
- `ToolToggle.tsx` - Individual tool enable/disable switch
- `ToolPreferences.tsx` - Per-tool configuration panel
- `ToolPrivacyInfo.tsx` - Privacy information display
- `ToolUsageStats.tsx` - Analytics dashboard

#### Settings Structure:
```typescript
interface ToolSettings {
  enabled: boolean;
  webSearch: {
    enabled: boolean;
    maxResults: number;
    engine: 'duckduckgo' | 'searx';
    rateLimit: number; // seconds between searches
  };
  fileOperations: {
    readEnabled: boolean;
    writeEnabled: boolean;
    allowedPaths: string[];
    requireConfirmation: boolean;
  };
  systemInfo: {
    enabled: boolean;
    privacyLevel: 'minimal' | 'standard' | 'full';
  };
  calculator: {
    enabled: boolean;
    precision: number;
  };
}
```

---

### 3. Tool Call History

**Goal**: Allow users to review past tool executions and understand AI behavior.

#### Features:
- **Tool History Panel**: Sidebar showing recent tool calls
- **Filterable by Tool Type**: Filter by web_search, file_read, etc.
- **Search Tool History**: Find specific tool executions
- **Export Tool Logs**: Download tool call history as JSON/CSV
- **Tool Call Details**: Full request/response for each execution

#### UI Components to Create:
- `ToolHistory.tsx` - Main history panel
- `ToolHistoryItem.tsx` - Individual history entry
- `ToolHistoryFilter.tsx` - Filter and search controls
- `ToolHistoryExport.tsx` - Export functionality

---

### 4. Plugin-Tool Integration (Foundation)

**Goal**: Enable user-created plugins to register as tools.

#### Features:
- **Plugin Discovery**: Scan plugins/ directory for tool definitions
- **Plugin Tool Registration**: Allow plugins to expose tools to AI
- **Plugin Tool UI**: Show plugin-provided tools in settings
- **Plugin Permissions**: User approves what tools plugins can access

#### Backend Changes Needed:
- `plugin_tool_bridge.rs` - Bridge between V8 plugins and ToolService
- Update PluginManager to register plugin tools on load
- Add permission system for plugin tool access

#### Plugin API Example:
```javascript
// In user plugin: my-plugin.js
export const tools = {
  searchDatabase: {
    name: 'search_database',
    description: 'Search the local SQLite database',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      }
    },
    async execute(params) {
      // Plugin implementation
      return { results: [...] };
    }
  }
};
```

---

## 🏗️ Implementation Plan

### Phase 1: Basic Visualization (Week 1)
- [ ] Create ToolCallIndicator component
- [ ] Create ToolResultCard component
- [ ] Integrate into Chat.tsx
- [ ] Add backend events for tool execution progress
- [ ] Test with all 6 existing tools

**Deliverable**: Users can see when tools are being used and view results

---

### Phase 2: Settings & Configuration (Week 2)
- [ ] Create ToolsSettings page
- [ ] Add tool toggle switches
- [ ] Implement per-tool preferences
- [ ] Add privacy dashboard
- [ ] Update backend to respect user settings
- [ ] Add settings persistence to database

**Deliverable**: Users can configure tool behavior and privacy

---

### Phase 3: Tool History (Week 3)
- [ ] Create database schema for tool call history
- [ ] Implement backend tracking of tool executions
- [ ] Create ToolHistory UI components
- [ ] Add filtering and search functionality
- [ ] Implement export functionality
- [ ] Add tool history to database migrations

**Deliverable**: Users can review and export tool usage history

---

### Phase 4: Plugin Integration Foundation (Week 4)
- [ ] Design plugin tool API
- [ ] Implement plugin_tool_bridge.rs
- [ ] Update PluginManager for tool registration
- [ ] Add permission system
- [ ] Create example plugin with custom tool
- [ ] Document plugin tool creation

**Deliverable**: Plugin developers can create custom tools

---

## 📊 Database Schema Changes

### New Tables:

```sql
-- Tool execution history
CREATE TABLE tool_call_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_input TEXT NOT NULL,  -- JSON
    tool_output TEXT NOT NULL, -- JSON
    execution_time_ms INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('success', 'error')),
    error_message TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Tool settings (per user)
CREATE TABLE tool_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name TEXT NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT 1,
    config TEXT NOT NULL, -- JSON with tool-specific settings
    updated_at INTEGER NOT NULL
);

-- Plugin tool registrations
CREATE TABLE plugin_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plugin_name TEXT NOT NULL,
    tool_name TEXT NOT NULL UNIQUE,
    tool_description TEXT NOT NULL,
    parameters_schema TEXT NOT NULL, -- JSON schema
    permissions TEXT NOT NULL, -- JSON array of required permissions
    enabled BOOLEAN NOT NULL DEFAULT 0, -- User must explicitly enable
    created_at INTEGER NOT NULL,
    FOREIGN KEY (plugin_name) REFERENCES plugins(name) ON DELETE CASCADE
);
```

---

## 🔧 Backend Services to Create

### 1. ToolHistoryService
**File**: `src-tauri/src/services/tool_history.rs`

**Responsibilities**:
- Record tool executions to database
- Retrieve tool history with filters
- Export history as JSON/CSV
- Calculate usage statistics

**Methods**:
```rust
impl ToolHistoryService {
    pub fn record_execution(&self, record: ToolCallRecord) -> Result<()>;
    pub fn get_history(&self, filters: ToolHistoryFilters) -> Result<Vec<ToolCallRecord>>;
    pub fn export_history(&self, format: ExportFormat) -> Result<String>;
    pub fn get_statistics(&self) -> Result<ToolUsageStats>;
    pub fn delete_history(&self, before: DateTime) -> Result<usize>;
}
```

---

### 2. ToolSettingsService
**File**: `src-tauri/src/services/tool_settings.rs`

**Responsibilities**:
- Persist tool settings to database
- Validate tool configurations
- Apply settings to tools at runtime
- Provide defaults for new tools

**Methods**:
```rust
impl ToolSettingsService {
    pub fn get_settings(&self, tool_name: &str) -> Result<ToolSettings>;
    pub fn update_settings(&self, tool_name: &str, settings: ToolSettings) -> Result<()>;
    pub fn reset_to_defaults(&self, tool_name: &str) -> Result<()>;
    pub fn get_all_settings(&self) -> Result<HashMap<String, ToolSettings>>;
}
```

---

### 3. PluginToolBridge
**File**: `src-tauri/src/services/plugin_tool_bridge.rs`

**Responsibilities**:
- Load plugin tool definitions from V8 runtime
- Convert plugin tools to ToolExecutor trait
- Handle permissions and sandboxing
- Execute plugin tools safely

**Methods**:
```rust
impl PluginToolBridge {
    pub fn discover_plugin_tools(&self, plugin_name: &str) -> Result<Vec<PluginToolDef>>;
    pub fn register_plugin_tool(&self, def: PluginToolDef) -> Result<()>;
    pub fn execute_plugin_tool(&self, name: &str, params: Value) -> Result<Value>;
    pub fn unregister_plugin_tools(&self, plugin_name: &str) -> Result<()>;
}
```

---

## 📱 Frontend Components

### 1. ToolCallIndicator.tsx
```typescript
interface ToolCallIndicatorProps {
  toolName: string;
  status: 'loading' | 'success' | 'error';
  executionTime?: number;
}

export function ToolCallIndicator({ toolName, status, executionTime }: ToolCallIndicatorProps) {
  // Animated badge showing tool usage
}
```

---

### 2. ToolsSettings.tsx
```typescript
interface ToolsSettingsProps {
  settings: ToolSettings;
  onUpdate: (settings: ToolSettings) => void;
}

export function ToolsSettings({ settings, onUpdate }: ToolsSettingsProps) {
  // Main settings panel with tabs for each tool
}
```

---

### 3. ToolHistory.tsx
```typescript
interface ToolHistoryProps {
  conversationId?: string;
  toolType?: string;
}

export function ToolHistory({ conversationId, toolType }: ToolHistoryProps) {
  // History panel with filtering and export
}
```

---

## 🧪 Testing Plan

### Unit Tests:
- ToolHistoryService (record, retrieve, export)
- ToolSettingsService (CRUD operations, validation)
- PluginToolBridge (discovery, registration, execution)
- All React components (rendering, interactions)

### Integration Tests:
- Tool execution → history recording
- Settings updates → tool behavior changes
- Plugin tool registration → execution flow

### E2E Tests:
- User enables web search → AI uses it → user sees result
- User disables file write → AI cannot write files
- User views tool history → filters by type → exports CSV

### Manual Testing Scenarios:
1. Enable all tools, ask complex question requiring multiple tools
2. Disable web search, verify AI cannot search
3. Configure file operations to specific directory
4. Create plugin with custom tool, register and use it
5. Export tool history and verify JSON/CSV format

---

## 📈 Success Metrics

- **User Visibility**: 100% of tool calls visible in UI
- **User Control**: Users can disable any tool in <3 clicks
- **Performance**: Tool visualization adds <100ms to render time
- **Privacy**: All tool data access explicitly shown to user
- **Plugin Adoption**: Example plugin with custom tool available

---

## 🚧 Known Challenges

### Challenge 1: Real-time Tool Status Updates
**Problem**: Need to show tool progress in real-time as AI executes

**Solution**: Use Tauri events to stream tool execution status
```rust
window.emit("tool-execution-start", { tool_name: "web_search", ... });
window.emit("tool-execution-progress", { progress: 50 });
window.emit("tool-execution-complete", { result: ... });
```

---

### Challenge 2: Plugin Tool Security
**Problem**: Plugins could register malicious tools

**Solution**:
- Sandboxed V8 execution (already implemented)
- Permission approval before tool registration
- User must explicitly enable each plugin tool
- Audit log of all plugin tool executions

---

### Challenge 3: Tool History Database Size
**Problem**: Tool history could grow unbounded

**Solution**:
- Configurable retention period (default: 30 days)
- Automatic cleanup of old history
- User option to disable history
- Export before deletion

---

## 🔄 Migration Plan

### Database Migrations:
```sql
-- Migration: 2025-01-17_tool_history.sql
CREATE TABLE tool_call_history (...);
CREATE INDEX idx_tool_history_conversation ON tool_call_history(conversation_id);
CREATE INDEX idx_tool_history_created ON tool_call_history(created_at);

-- Migration: 2025-01-17_tool_settings.sql
CREATE TABLE tool_settings (...);
INSERT INTO tool_settings (tool_name, enabled, config, updated_at)
VALUES
  ('web_search', 1, '{"maxResults": 5, "engine": "duckduckgo"}', ...),
  ('url_fetch', 1, '{"timeout": 10000}', ...),
  -- ... defaults for all 6 tools
;

-- Migration: 2025-01-17_plugin_tools.sql
CREATE TABLE plugin_tools (...);
```

---

## 📚 Documentation Updates

### User Documentation:
- Add "Tool System" section to USER_GUIDE.md
- Document each tool and what it does
- Explain privacy implications
- Show how to configure tools

### Developer Documentation:
- Add "Creating Plugin Tools" guide
- Document PluginToolBridge API
- Add examples for each tool type
- Update API.md with new commands

---

## 🎯 v3.7.0 Acceptance Criteria

- [ ] All tool executions visible in chat interface
- [ ] Users can enable/disable any of the 6 tools
- [ ] Tool history panel shows past executions
- [ ] Settings panel has "Tools" tab with all configurations
- [ ] At least 1 example plugin with custom tool
- [ ] All tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Build succeeds with 0 errors
- [ ] Privacy dashboard shows tool permissions

---

## 🚀 Beyond v3.7.0

### v3.8.0 Ideas (Future):
- **Tool Marketplace**: Discover and install community tools
- **Tool Recommendations**: AI suggests tools based on context
- **Tool Chaining**: Visual editor for multi-tool workflows
- **Tool Monitoring**: Real-time dashboard of active tools
- **Tool Budgets**: Rate limiting per tool (e.g., max 10 searches/day)

---

**Next Steps After v3.7.0**:
1. User testing with 5-10 beta testers
2. Gather feedback on tool UI/UX
3. Performance optimization
4. Plugin marketplace planning
5. Prepare for v1.0.0 stable release

---

**Estimated Timeline**: 4 weeks (Week 1-4)
**Estimated LOC**: +1,500 lines (Backend: ~800, Frontend: ~700)
**Dependencies**: v3.6.0 must be fully tested and stable

---

**Status**: ✅ Planning Complete - Ready for Implementation
