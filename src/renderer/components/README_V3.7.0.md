# V3.7.0 React Components

This directory contains the frontend UI components for Garden of Eden v3.7.0 features.

---

## 📁 Component Structure

```
components/
├── graphrag/
│   └── GraphRAGPanel.tsx       - Knowledge graph search interface
├── react/
│   └── ReActPanel.tsx          - Reasoning agent interface
└── planner/
    └── PlannerPanel.tsx        - Multi-step planning interface
```

---

## 🧩 Components Overview

### 1. GraphRAGPanel

**Location:** `components/graphrag/GraphRAGPanel.tsx`

**Purpose:** Interactive interface for knowledge graph-based retrieval

**Features:**
- Entity search with relevance scoring
- Graph statistics dashboard
- Entity detail modal
- Responsive grid layout
- Dark mode support

**Props:** None (self-contained)

**Usage:**
```tsx
import GraphRAGPanel from './components/graphrag/GraphRAGPanel';

function App() {
  return <GraphRAGPanel />;
}
```

**State Management:**
- `query` - Current search query
- `results` - Search results array
- `stats` - Graph statistics
- `selectedEntity` - Entity for detail modal
- `loading` - Loading state
- `error` - Error messages

**Backend Commands Used:**
- `graphrag_retrieve` - Search the knowledge graph
- `graphrag_stats` - Get graph statistics
- `graphrag_load_entity` - Load entity details
- `graphrag_build_graph` - Build graph from text

---

### 2. ReActPanel

**Location:** `components/react/ReActPanel.tsx`

**Purpose:** Interactive interface for ReAct (Reasoning + Acting) agent

**Features:**
- Query input with textarea
- Real-time reasoning step display
- Color-coded step types
- Execution timeline
- Configuration panel
- Final answer highlight

**Props:** None (self-contained)

**Usage:**
```tsx
import ReActPanel from './components/react/ReActPanel';

function App() {
  return <ReActPanel />;
}
```

**State Management:**
- `query` - User's task/query
- `execution` - Execution results
- `config` - Agent configuration
- `loading` - Loading state
- `error` - Error messages
- `showConfig` - Config panel visibility

**Backend Commands Used:**
- `react_execute` - Execute ReAct reasoning loop
- `react_get_config` - Get agent configuration

**Step Types:**
- **Thought** 💭 (Blue) - Agent's reasoning
- **Action** ⚡ (Orange) - Tool execution
- **Observation** 👁️ (Purple) - Action result
- **Answer** ✅ (Green) - Final answer

---

### 3. PlannerPanel

**Location:** `components/planner/PlannerPanel.tsx`

**Purpose:** Multi-step planning with user approval workflow

**Features:**
- Plan generation form
- Multi-tab navigation (Input/Review/Execution)
- Risk warnings
- Step dependency visualization
- Real-time execution monitoring
- Statistics dashboard
- Execution logs

**Props:** None (self-contained)

**Usage:**
```tsx
import PlannerPanel from './components/planner/PlannerPanel';

function App() {
  return <PlannerPanel />;
}
```

**State Management:**
- `goal` - User's goal description
- `currentPlan` - Generated/active plan
- `execution` - Execution results
- `stats` - Planner statistics
- `loading` - Loading state
- `error` - Error messages
- `view` - Current tab view

**Views:**
- **Input** - Goal entry and stats
- **Review** - Plan review with approve/reject
- **Execution** - Real-time execution monitoring

**Backend Commands Used:**
- `planner_generate` - Generate plan from goal
- `planner_approve` - Approve plan for execution
- `planner_execute` - Execute approved plan
- `planner_reject` - Reject/cancel plan
- `planner_stats` - Get statistics

**Step Statuses:**
- **Pending** ⏸️ (Yellow) - Awaiting execution
- **In Progress** ⏳ (Blue) - Currently executing
- **Completed** ✅ (Green) - Successfully completed
- **Failed** ❌ (Red) - Execution failed
- **Skipped** ⏭️ (Gray) - Skipped due to dependencies

---

## 🎨 Styling

All components use **Tailwind CSS** with dark mode support.

### Theme Classes

**Light Mode:**
- Backgrounds: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Text: `text-gray-800`, `text-gray-600`
- Borders: `border-gray-300`

**Dark Mode:**
- Backgrounds: `dark:bg-gray-800`, `dark:bg-gray-900`
- Text: `dark:text-gray-200`, `dark:text-gray-400`
- Borders: `dark:border-gray-600`

### Color Palette

**Status Colors:**
- Success: `green-600` (light), `green-400` (dark)
- Error: `red-600` (light), `red-400` (dark)
- Warning: `yellow-600` (light), `yellow-400` (dark)
- Info: `blue-600` (light), `blue-400` (dark)
- Secondary: `gray-600` (light), `gray-400` (dark)

---

## 🔧 Component Integration

### Add to Navigation

```tsx
// Example: Add to sidebar
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();

  return (
    <nav>
      <button onClick={() => navigate('/graphrag')}>
        🧠 Knowledge Graph
      </button>
      <button onClick={() => navigate('/react')}>
        🤔 ReAct Agent
      </button>
      <button onClick={() => navigate('/planner')}>
        📋 Plan-and-Solve
      </button>
    </nav>
  );
}
```

### Add Routes

```tsx
// Example: React Router setup
import { Routes, Route } from 'react-router-dom';
import GraphRAGPanel from './components/graphrag/GraphRAGPanel';
import ReActPanel from './components/react/ReActPanel';
import PlannerPanel from './components/planner/PlannerPanel';

function App() {
  return (
    <Routes>
      <Route path="/graphrag" element={<GraphRAGPanel />} />
      <Route path="/react" element={<ReActPanel />} />
      <Route path="/planner" element={<PlannerPanel />} />
    </Routes>
  );
}
```

---

## 📦 Dependencies

All components require:

```json
{
  "dependencies": {
    "react": "^18.x",
    "@tauri-apps/api": "^2.x",
    "tailwindcss": "^3.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "typescript": "^5.x"
  }
}
```

---

## 🧪 Testing Components

### Unit Tests

```tsx
// Example: Testing GraphRAGPanel
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GraphRAGPanel from './GraphRAGPanel';

// Mock Tauri invoke
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

test('renders search input', () => {
  render(<GraphRAGPanel />);
  const searchInput = screen.getByPlaceholderText(/search knowledge graph/i);
  expect(searchInput).toBeInTheDocument();
});

test('displays search results', async () => {
  const mockResults = {
    results: [
      {
        entity: { name: 'Test Entity', entity_type: 'Person' },
        relevance_score: 0.95,
        retrieval_path: [],
      },
    ],
  };

  (invoke as jest.Mock).mockResolvedValue(mockResults);

  render(<GraphRAGPanel />);
  const searchInput = screen.getByPlaceholderText(/search knowledge graph/i);

  fireEvent.change(searchInput, { target: { value: 'test query' } });
  fireEvent.submit(searchInput.closest('form')!);

  await waitFor(() => {
    expect(screen.getByText('Test Entity')).toBeInTheDocument();
  });
});
```

---

## 🎯 Best Practices

### 1. Error Handling

Always handle errors from backend commands:

```tsx
try {
  const result = await invoke('command_name', params);
  // Handle success
} catch (error) {
  setError(error as string);
  console.error('Command failed:', error);
}
```

### 2. Loading States

Show loading indicators during async operations:

```tsx
setLoading(true);
try {
  const result = await invoke('command_name', params);
  // Process result
} finally {
  setLoading(false);
}
```

### 3. Form Validation

Validate user input before API calls:

```tsx
const handleSubmit = async () => {
  if (!query.trim()) {
    setError('Please enter a query');
    return;
  }

  // Proceed with API call
};
```

### 4. Accessibility

Use semantic HTML and ARIA labels:

```tsx
<button
  aria-label="Search knowledge graph"
  disabled={loading}
  className="..."
>
  {loading ? 'Searching...' : 'Search'}
</button>
```

---

## 🔄 State Management

### Local State (useState)

Components use local state for UI-specific data:

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);
```

### Future: Global State

For sharing data between components, consider:

- **Context API** - For theme, user preferences
- **Zustand** - Lightweight state management
- **Redux Toolkit** - For complex state

Example with Context:

```tsx
// GraphRAGContext.tsx
export const GraphRAGContext = createContext(null);

export function GraphRAGProvider({ children }) {
  const [graphStats, setGraphStats] = useState(null);

  return (
    <GraphRAGContext.Provider value={{ graphStats, setGraphStats }}>
      {children}
    </GraphRAGContext.Provider>
  );
}

// Use in components
const { graphStats } = useContext(GraphRAGContext);
```

---

## 🚀 Performance Optimization

### 1. Memoization

Use `useMemo` for expensive computations:

```tsx
const sortedResults = useMemo(() => {
  return results.sort((a, b) => b.relevance_score - a.relevance_score);
}, [results]);
```

### 2. Debouncing

Debounce search inputs:

```tsx
import { useDebounce } from 'use-debounce';

const [query, setQuery] = useState('');
const [debouncedQuery] = useDebounce(query, 500);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

### 3. Virtual Lists

For large result sets, use virtual scrolling:

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={results.length}
  itemSize={100}
>
  {({ index, style }) => (
    <div style={style}>
      <ResultCard result={results[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 📱 Responsive Design

All components are responsive with Tailwind breakpoints:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🎨 Customization

### Theme Customization

Modify Tailwind config to change theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // Custom primary color
        secondary: '#8b5cf6',
      },
    },
  },
};
```

### Component Variants

Create variants for different use cases:

```tsx
// CompactGraphRAGPanel.tsx
export function CompactGraphRAGPanel() {
  return (
    <div className="max-w-md">
      {/* Compact version */}
    </div>
  );
}
```

---

## 📚 Related Documentation

- [User Guide](../../../docs/V3.7.0_USER_GUIDE.md)
- [API Reference](../../../docs/V3.7.0_API_REFERENCE.md)
- [Quick Start](../../../docs/V3.7.0_QUICKSTART.md)
- [Integration Summary](../../../docs/V3.7.0_INTEGRATION_SUMMARY.md)

---

**Version**: 3.7.0
**Last Updated**: November 2024
**Maintainer**: Garden of Eden Team
