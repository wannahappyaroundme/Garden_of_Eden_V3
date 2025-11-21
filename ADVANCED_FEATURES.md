# Advanced LLM Features Implementation Plan (v3.6.0-v3.8.0)

**Garden of Eden V3 - Advanced AI Capabilities**

This document outlines the implementation of enterprise-grade LLM features including performance optimization, advanced reasoning patterns, code execution, and self-correction mechanisms.

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Phase 1: Performance Optimization (v3.6.0)](#phase-1-performance-optimization-v360)
4. [Phase 2: GraphRAG Implementation (v3.7.0)](#phase-2-graphrag-implementation-v370)
5. [Phase 3: ReAct & Plan-and-Solve (v3.7.0)](#phase-3-react--plan-and-solve-v370)
6. [Phase 4: Code Interpreter (v3.8.0)](#phase-4-code-interpreter-v380)
7. [Phase 5: Self-Correction & Reflection (v3.8.0)](#phase-5-self-correction--reflection-v380)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Architecture](#technical-architecture)
10. [Success Metrics](#success-metrics)
11. [Security Considerations](#security-considerations)

---

## Overview

### Goals

Transform Garden of Eden V3 into a production-ready AI assistant with:
- **Performance**: Sub-3s responses, efficient context management
- **Intelligence**: Multi-hop reasoning, structured planning
- **Capabilities**: Code execution, web scraping, data analysis
- **Reliability**: Self-correction, verification, confidence scoring

### Key Features to Implement

| Feature | Purpose | Priority | Version |
|---------|---------|----------|---------|
| Hybrid Search + Re-ranking | RAG accuracy +30% | HIGH | v3.6.0 |
| Attention Sink | Long context handling | HIGH | v3.6.0 |
| Prompt Caching | Speed +50% | MEDIUM | v3.6.0 |
| GraphRAG | Context understanding | HIGH | v3.7.0 |
| ReAct Pattern | Structured reasoning | HIGH | v3.7.0 |
| Plan-and-Solve | User confirmation | HIGH | v3.7.0 |
| Python Sandbox | Code execution | CRITICAL | v3.8.0 |
| Self-Correction | Quality assurance | MEDIUM | v3.8.0 |

---

## Current State Analysis

### ✅ Already Implemented

1. **RAG System** (`rag.rs`, `embedding.rs`)
   - BGE-M3 embeddings (1024-dim)
   - Semantic search with cosine similarity
   - Episode storage and retrieval
   - Top-K retrieval (default: 3)

2. **Tool Calling** (`tool_calling.rs`, `tool_implementations.rs`)
   - 7 production tools (WebSearch, UrlFetch, FileRead, FileWrite, Calculator, SystemInfo, Git)
   - Multi-turn agentic loops
   - OpenAI-compatible function calling
   - Event-based execution tracking

3. **Chain-of-Thought** (`raft.rs`)
   - RAFT hallucination reduction
   - CoT prompting enabled by default
   - Relevance filtering (threshold: 0.5)

4. **Conversation Memory** (`conversation_memory.rs`)
   - Summary Buffer pattern
   - Recent 10 messages + summary
   - Automatic summarization at 20+ messages

5. **Persona Learning** (`learning.rs`)
   - 10-dimensional persona parameters
   - Feedback-based optimization
   - System prompt generation

6. **Vision** (`llava.rs`)
   - LLaVA 7B for screenshot analysis
   - 3-level screen context

### ❌ Missing Features

1. **Performance**
   - No prompt caching
   - No flash attention support
   - No token counting
   - No batch inference

2. **Search Quality**
   - Only semantic search (no lexical)
   - No re-ranking
   - No metadata filtering

3. **Reasoning**
   - No explicit ReAct pattern
   - No self-correction loops
   - No verification step
   - No confidence scoring

4. **Code Execution**
   - No sandboxed Python runtime
   - Calculator only evaluates simple expressions
   - No data processing capabilities

5. **Knowledge Graphs**
   - No graph-based reasoning
   - No entity extraction
   - No relationship modeling

---

## Phase 1: Performance Optimization (v3.6.0)

### 1.1 Flash Attention & Prompt Caching

#### Prompt Caching System

**Objective**: Cache repeated system prompts to reduce inference time by 50%

**Implementation** (`services/prompt_cache.rs`):

```rust
pub struct PromptCache {
    cache: Arc<Mutex<HashMap<String, CachedPrompt>>>,
    max_entries: usize,
    ttl_seconds: u64,
}

struct CachedPrompt {
    prompt_hash: String,
    kv_cache: Vec<f32>,  // Cached KV states
    timestamp: SystemTime,
    access_count: u64,
}

impl PromptCache {
    // Cache system prompts that repeat frequently
    pub fn get_or_compute(&self, prompt: &str) -> Result<Vec<f32>>;

    // Evict old or low-access entries
    pub fn evict_lru(&mut self);

    // Compute SHA-256 hash for cache key
    fn hash_prompt(&self, prompt: &str) -> String;
}
```

**Key Features**:
- LRU eviction policy
- TTL: 1 hour per cache entry
- Max entries: 100 prompts
- Hash-based deduplication

**Integration Point**: Modify `ollama.rs` to check cache before sending full prompt

---

#### Token Counting

**Objective**: Track context window usage to prevent overflow

**Implementation** (`services/token_counter.rs`):

```rust
pub struct TokenCounter {
    tokenizer: Tokenizer,  // tiktoken or similar
}

impl TokenCounter {
    // Count tokens in text
    pub fn count(&self, text: &str) -> usize;

    // Estimate context window usage
    pub fn estimate_usage(&self,
        system_prompt: &str,
        user_message: &str,
        context: &[String]) -> ContextUsage;

    // Trim context to fit window
    pub fn trim_to_fit(&self,
        context: Vec<String>,
        max_tokens: usize) -> Vec<String>;
}

pub struct ContextUsage {
    pub system_tokens: usize,
    pub user_tokens: usize,
    pub context_tokens: usize,
    pub total_tokens: usize,
    pub remaining_tokens: usize,
    pub utilization_percent: f32,
}
```

**Context Window Limits**:
- Qwen 2.5: 32,768 tokens
- Reserve 2,048 tokens for response
- Warning at 85% usage
- Auto-trim at 90% usage

---

### 1.2 Hybrid Search + Re-ranking

#### BM25 Lexical Search

**Objective**: Combine keyword matching with semantic search for 30% better precision

**Implementation** (`services/bm25.rs`):

```rust
pub struct BM25Index {
    documents: Vec<Document>,
    idf_scores: HashMap<String, f32>,
    avg_doc_length: f32,
    k1: f32,  // Term frequency saturation (default: 1.5)
    b: f32,   // Length normalization (default: 0.75)
}

struct Document {
    id: String,
    terms: HashMap<String, usize>,  // term -> frequency
    length: usize,
}

impl BM25Index {
    // Build index from episodic memory
    pub fn build_from_episodes(&mut self, episodes: Vec<Episode>);

    // Search with BM25 scoring
    pub fn search(&self, query: &str, top_k: usize) -> Vec<ScoredDocument>;

    // Compute BM25 score for document
    fn compute_score(&self, doc: &Document, query_terms: &[String]) -> f32;

    // Calculate IDF for term
    fn idf(&self, term: &str) -> f32;
}
```

**BM25 Formula**:
```
score(D, Q) = Σ IDF(qi) × (f(qi, D) × (k1 + 1)) / (f(qi, D) + k1 × (1 - b + b × |D| / avgdl))
```

Where:
- `f(qi, D)` = term frequency in document
- `|D|` = document length
- `avgdl` = average document length
- `IDF(qi)` = inverse document frequency

---

#### Hybrid Search Fusion

**Objective**: Combine BM25 and BGE-M3 results using Reciprocal Rank Fusion (RRF)

**Implementation** (`services/hybrid_search.rs`):

```rust
pub struct HybridSearchEngine {
    bm25_index: BM25Index,
    semantic_index: EmbeddingService,
    fusion_weights: FusionWeights,
}

struct FusionWeights {
    bm25_weight: f32,      // Default: 0.3
    semantic_weight: f32,  // Default: 0.7
    rrf_k: f32,            // RRF parameter (default: 60)
}

impl HybridSearchEngine {
    // Hybrid search with RRF fusion
    pub async fn search(&self,
        query: &str,
        top_k: usize) -> Result<Vec<ScoredEpisode>>;

    // Reciprocal Rank Fusion
    fn rrf_fusion(&self,
        bm25_results: Vec<ScoredDocument>,
        semantic_results: Vec<ScoredDocument>) -> Vec<ScoredDocument>;
}
```

**RRF Formula**:
```
RRF_score(d) = Σ 1 / (k + rank(d))
```

For each document, sum ranks from both retrievers with parameter k=60.

---

#### Cross-Encoder Re-ranking

**Objective**: Refine top-20 results to top-3 with +15% accuracy

**Implementation** (`services/reranker.rs`):

```rust
pub struct CrossEncoderReranker {
    model: OnnxModel,  // cross-encoder/ms-marco-MiniLM-L-12-v2
    tokenizer: Tokenizer,
}

impl CrossEncoderReranker {
    // Re-rank top candidates
    pub async fn rerank(&self,
        query: &str,
        candidates: Vec<Episode>,
        top_k: usize) -> Result<Vec<ScoredEpisode>>;

    // Compute relevance score for query-document pair
    fn score_pair(&self, query: &str, document: &str) -> f32;

    // Batch scoring for efficiency
    fn batch_score(&self, pairs: Vec<(String, String)>) -> Vec<f32>;
}
```

**Model**: `cross-encoder/ms-marco-MiniLM-L-12-v2`
- Input: `[CLS] query [SEP] document [SEP]`
- Output: Relevance score (0-1)
- Size: 33MB ONNX model
- Speed: ~10ms per pair

**Pipeline**:
1. Hybrid search retrieves top-20
2. Cross-encoder scores all 20
3. Re-sort by cross-encoder scores
4. Return top-3 most relevant

---

### 1.3 Attention Sink (Long Context)

#### StreamingLLM Pattern

**Objective**: Handle 100K+ token conversations without "lost in middle" problem

**Implementation** (`services/attention_sink.rs`):

```rust
pub struct AttentionSinkManager {
    sink_size: usize,        // First N tokens to keep (default: 4)
    window_size: usize,      // Recent tokens window (default: 4000)
    compression_ratio: f32,  // How much to compress middle (default: 0.1)
}

pub struct ManagedContext {
    pub attention_sink: Vec<Token>,  // First 4 tokens (anchor)
    pub compressed_middle: String,   // Summarized middle section
    pub recent_window: Vec<Token>,   // Recent 4000 tokens
    pub total_original_tokens: usize,
}

impl AttentionSinkManager {
    // Process long conversation context
    pub fn manage_context(&self,
        full_context: Vec<Token>) -> ManagedContext;

    // Compress middle section with summarization
    async fn compress_middle(&self,
        tokens: Vec<Token>) -> String;

    // Validate attention pattern
    fn validate_attention_distribution(&self,
        context: &ManagedContext) -> f32;
}
```

**Algorithm**:
```
Input: Conversation tokens (100K tokens)

1. Keep first 4 tokens (attention sink)
2. Compress middle section:
   - Divide into chunks of 2000 tokens
   - Summarize each chunk with LLM
   - Result: ~200 tokens per chunk (10x compression)
3. Keep recent 4000 tokens (working memory)

Output: 4 + compressed_middle + 4000 tokens (~10K total)
```

**Benefits**:
- Prevents attention degradation in long contexts
- Maintains first/last token importance
- Reduces context from 100K → 10K tokens
- Preserves conversation coherence

---

### 1.4 Batch Inference

**Objective**: Process multiple queries simultaneously for dashboards/analytics

**Implementation** (`services/batch_inference.rs`):

```rust
pub struct BatchInferenceEngine {
    ollama_client: OllamaClient,
    max_batch_size: usize,  // Default: 8
    timeout_seconds: u64,
}

impl BatchInferenceEngine {
    // Process multiple queries in parallel
    pub async fn batch_generate(&self,
        queries: Vec<InferenceRequest>) -> Vec<InferenceResult>;

    // Dynamic batching with timeout
    pub async fn dynamic_batch(&self,
        query: InferenceRequest,
        max_wait_ms: u64) -> InferenceResult;
}

struct InferenceRequest {
    pub query: String,
    pub context: Vec<String>,
    pub parameters: GenerationParams,
}
```

**Use Cases**:
- Dashboard: Generate summaries for multiple conversations
- Analytics: Batch classify user feedback
- Reports: Generate multiple chart descriptions

---

## Phase 2: GraphRAG Implementation (v3.7.0)

### 2.1 Knowledge Graph Construction

#### Entity Extraction

**Objective**: Extract entities and relationships from conversations to build knowledge graph

**Implementation** (`services/entity_extractor.rs`):

```rust
pub struct EntityExtractor {
    llm_client: OllamaClient,
    entity_types: Vec<EntityType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntityType {
    Person,
    Organization,
    Location,
    Technology,
    Concept,
    Tool,
    Project,
    Document,
    Event,
}

pub struct Entity {
    pub id: String,
    pub entity_type: EntityType,
    pub name: String,
    pub aliases: Vec<String>,
    pub properties: HashMap<String, String>,
    pub first_mentioned: i64,
    pub mention_count: usize,
    pub importance: f32,
}

pub struct Relationship {
    pub id: String,
    pub source_entity_id: String,
    pub target_entity_id: String,
    pub relationship_type: RelationshipType,
    pub properties: HashMap<String, String>,
    pub confidence: f32,
    pub evidence: Vec<String>,  // Conversation IDs where mentioned
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RelationshipType {
    WorksWith,
    PartOf,
    Uses,
    Creates,
    Knows,
    Located At,
    DependsOn,
    RelatesTo,
}

impl EntityExtractor {
    // Extract entities from conversation message
    pub async fn extract_entities(&self,
        message: &str) -> Result<Vec<Entity>>;

    // Extract relationships between entities
    pub async fn extract_relationships(&self,
        message: &str,
        entities: &[Entity]) -> Result<Vec<Relationship>>;

    // Entity disambiguation (resolve "it", "he", "that tool")
    pub fn disambiguate(&self,
        entity_mention: &str,
        context: &ConversationContext) -> Option<Entity>;
}
```

**Entity Extraction Prompt**:
```
Given the following message, extract all entities and classify them:

Message: "{message}"

Return JSON array of entities:
[
  {
    "name": "entity name",
    "type": "Person|Organization|Technology|Concept|...",
    "properties": {"key": "value"}
  }
]

Extract only concrete entities, not abstract concepts.
```

**Relationship Extraction Prompt**:
```
Given entities and message, extract relationships:

Entities: {entities}
Message: "{message}"

Return JSON array of relationships:
[
  {
    "source": "entity1",
    "target": "entity2",
    "type": "WorksWith|Uses|Creates|...",
    "confidence": 0.0-1.0
  }
]
```

---

#### Graph Storage

**Database Schema** (`database/schema.rs`):

```sql
-- Knowledge Graph Entities
CREATE TABLE kg_entities (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    aliases TEXT,  -- JSON array of alternative names
    properties TEXT,  -- JSON object of key-value pairs
    first_mentioned INTEGER NOT NULL,
    mention_count INTEGER DEFAULT 1,
    importance REAL DEFAULT 0.5,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_kg_entities_type ON kg_entities(entity_type);
CREATE INDEX idx_kg_entities_name ON kg_entities(name);

-- Knowledge Graph Relationships
CREATE TABLE kg_relationships (
    id TEXT PRIMARY KEY,
    source_entity_id TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    properties TEXT,  -- JSON object
    confidence REAL DEFAULT 0.8,
    evidence TEXT,  -- JSON array of conversation IDs
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (source_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
);

CREATE INDEX idx_kg_rel_source ON kg_relationships(source_entity_id);
CREATE INDEX idx_kg_rel_target ON kg_relationships(target_entity_id);
CREATE INDEX idx_kg_rel_type ON kg_relationships(relationship_type);

-- Entity-Document Mapping (which conversations mention which entities)
CREATE TABLE kg_entity_documents (
    entity_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    mention_context TEXT,  -- Surrounding text
    created_at INTEGER NOT NULL,
    PRIMARY KEY (entity_id, message_id),
    FOREIGN KEY (entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
);

-- Graph Communities (topic clusters)
CREATE TABLE kg_communities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    entity_ids TEXT NOT NULL,  -- JSON array
    description TEXT,
    size INTEGER DEFAULT 0,
    density REAL DEFAULT 0.0,
    created_at INTEGER NOT NULL
);
```

---

#### Graph Construction Pipeline

**Implementation** (`services/graph_builder.rs`):

```rust
pub struct GraphBuilder {
    entity_extractor: EntityExtractor,
    db: Arc<Mutex<Database>>,
}

impl GraphBuilder {
    // Build graph from conversation history
    pub async fn build_from_conversation(&self,
        conversation_id: &str) -> Result<()>;

    // Incremental update as new messages arrive
    pub async fn update_from_message(&self,
        message: &Message) -> Result<()>;

    // Merge duplicate entities
    pub async fn merge_entities(&self,
        entity1_id: &str,
        entity2_id: &str) -> Result<()>;

    // Calculate entity importance
    pub async fn calculate_importance(&self) -> Result<()>;

    // Detect communities using Louvain algorithm
    pub async fn detect_communities(&self) -> Result<Vec<Community>>;
}
```

**Entity Importance Formula**:
```
importance(e) = 0.3 × mention_count_normalized
               + 0.3 × relationship_count_normalized
               + 0.2 × recency_score
               + 0.2 × centrality_score
```

Where:
- `mention_count_normalized` = log(mentions) / log(max_mentions)
- `relationship_count_normalized` = degree / max_degree
- `recency_score` = exp(-(now - last_mention) / week)
- `centrality_score` = betweenness centrality in graph

---

### 2.2 Graph-Enhanced Retrieval

#### Multi-Hop Graph Traversal

**Objective**: Find contextually relevant information through graph relationships

**Implementation** (`services/graphrag.rs`):

```rust
pub struct GraphRAG {
    graph_db: Arc<Mutex<Database>>,
    embedding_service: EmbeddingService,
    max_hops: usize,  // Default: 2
}

pub struct GraphContext {
    pub entities: Vec<Entity>,
    pub relationships: Vec<Relationship>,
    pub subgraph: SubGraph,
    pub relevance_score: f32,
}

impl GraphRAG {
    // Retrieve context using graph traversal
    pub async fn retrieve_with_graph(&self,
        query: &str,
        top_k: usize) -> Result<GraphContext>;

    // Extract query entities
    async fn extract_query_entities(&self, query: &str) -> Vec<Entity>;

    // Traverse graph from seed entities
    async fn traverse_graph(&self,
        seed_entities: Vec<Entity>,
        max_hops: usize) -> SubGraph;

    // Score subgraph relevance to query
    fn score_subgraph(&self, subgraph: &SubGraph, query: &str) -> f32;

    // Format graph context for LLM
    fn format_graph_context(&self, context: &GraphContext) -> String;
}
```

**Traversal Algorithm**:
```
1. Extract entities from query (e.g., "React", "TypeScript")
2. Find matching entities in knowledge graph
3. BFS traversal from seed entities (max 2 hops):
   - Collect connected entities
   - Collect relationships
   - Weight by relationship confidence
4. Score subgraph by relevance to query
5. Format as structured context for LLM
```

**Example Graph Context Format**:
```
**Relevant Knowledge:**

Entities:
- React (Technology): JavaScript library for building UIs
- TypeScript (Technology): Typed superset of JavaScript
- Redux (Tool): State management library

Relationships:
- React USES TypeScript (confidence: 0.9)
- React INTEGRATES_WITH Redux (confidence: 0.85)
- TypeScript SUPPORTS React (confidence: 1.0)

Context:
In your previous conversations, you've been working with React and TypeScript.
You mentioned using Redux for state management in your project.
```

---

#### Hybrid: Vector + Graph Retrieval

**Combined Approach**:

```rust
pub async fn hybrid_retrieve(&self,
    query: &str,
    top_k: usize) -> Result<Vec<ContextChunk>> {

    // 1. Vector similarity search
    let vector_results = self.semantic_search(query, top_k * 2).await?;

    // 2. Extract query entities
    let query_entities = self.extract_query_entities(query).await?;

    // 3. Graph traversal from query entities
    let graph_context = self.traverse_graph(query_entities, 2).await?;

    // 4. Find documents mentioning graph entities
    let graph_documents = self.get_entity_documents(&graph_context).await?;

    // 5. Merge results with RRF
    let merged = self.merge_results(vector_results, graph_documents)?;

    // 6. Return top-K
    Ok(merged.into_iter().take(top_k).collect())
}
```

**Benefits**:
- Vector search finds semantically similar content
- Graph traversal finds contextually connected information
- Combination covers both similarity and relationships

---

## Phase 3: ReAct & Plan-and-Solve (v3.7.0)

### 3.1 ReAct Pattern (Reasoning + Acting)

#### ReAct Loop Architecture

**Objective**: Structured reasoning with explicit thought-action-observation cycles

**Implementation** (`services/react_agent.rs`):

```rust
pub struct ReActAgent {
    llm_client: OllamaClient,
    tool_service: Arc<ToolService>,
    max_iterations: usize,  // Default: 5
}

#[derive(Debug, Clone)]
pub enum ReActStep {
    Thought(String),
    Action(ToolCall),
    Observation(ToolResult),
    Answer(String),
}

pub struct ReActExecution {
    pub steps: Vec<ReActStep>,
    pub final_answer: Option<String>,
    pub iterations_used: usize,
    pub success: bool,
    pub error: Option<String>,
}

impl ReActAgent {
    // Execute ReAct loop
    pub async fn execute(&self,
        user_query: &str,
        context: &ConversationContext) -> Result<ReActExecution>;

    // Generate next step (thought/action/answer)
    async fn generate_next_step(&self,
        query: &str,
        history: &[ReActStep]) -> Result<ReActStep>;

    // Execute tool action
    async fn execute_action(&self, action: &ToolCall) -> Result<ToolResult>;

    // Check if task is complete
    fn is_complete(&self, steps: &[ReActStep]) -> bool;
}
```

**ReAct Prompt Format**:
```
You are solving the following task using ReAct (Reasoning + Acting) framework.

Task: {user_query}

Available Tools:
{tool_definitions}

Previous Steps:
{step_history}

Think step-by-step. Format your response as ONE of:

Thought: [Your reasoning about what to do next]
Action: [Tool name and parameters in JSON]
Answer: [Final answer to the user]

Example:
Thought: I need to search for recent news about AI.
Action: {"tool": "web_search", "query": "latest AI news 2025"}

Now continue:
```

**Example ReAct Execution**:
```
User: What's the weather in Tokyo and what time is it there?

Thought: I need to get weather information for Tokyo.
Action: {"tool": "web_search", "query": "Tokyo weather now"}

Observation: [Search results: "Tokyo: 15°C, Partly cloudy, 3:45 PM JST"]

Thought: I got the weather. Now I need the current time.
Action: {"tool": "system_info", "command": "get_timezone_time", "timezone": "Asia/Tokyo"}

Observation: [Result: "15:45 JST (UTC+9)"]

Thought: I have both pieces of information.
Answer: In Tokyo, it's currently 15°C with partly cloudy skies, and the local time is 3:45 PM (JST).
```

---

### 3.2 Plan-and-Solve with User Confirmation

#### Planning Framework

**Objective**: Generate actionable plans and get user approval before execution

**Implementation** (`services/planner.rs`):

```rust
pub struct Planner {
    llm_client: OllamaClient,
    react_agent: ReActAgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: String,
    pub goal: String,
    pub steps: Vec<PlanStep>,
    pub estimated_time: String,
    pub required_tools: Vec<String>,
    pub risks: Vec<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub step_number: usize,
    pub description: String,
    pub action: String,
    pub expected_output: String,
    pub depends_on: Vec<usize>,  // Step dependencies
    pub status: StepStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StepStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Skipped,
}

impl Planner {
    // Generate plan from user goal
    pub async fn generate_plan(&self, goal: &str) -> Result<Plan>;

    // Execute approved plan
    pub async fn execute_plan(&self, plan: &Plan) -> Result<PlanExecution>;

    // Handle step failure and re-plan
    async fn handle_step_failure(&self,
        plan: &Plan,
        failed_step: usize) -> Result<Plan>;
}
```

**Plan Generation Prompt**:
```
Generate a step-by-step plan to achieve the following goal:

Goal: {user_goal}

Available Tools: {tool_list}

Format your response as JSON:
{
  "steps": [
    {
      "step_number": 1,
      "description": "Clear description of what to do",
      "action": "Tool or operation to perform",
      "expected_output": "What success looks like",
      "depends_on": []
    }
  ],
  "estimated_time": "e.g., 5 minutes",
  "required_tools": ["tool1", "tool2"],
  "risks": ["Potential issue 1", "Potential issue 2"]
}

Make the plan:
- Specific and actionable
- Broken into 3-7 clear steps
- Realistic with available tools
- Include dependencies between steps
```

**Example Generated Plan**:
```json
{
  "goal": "Create a Python script to analyze CSV sales data and generate a report",
  "steps": [
    {
      "step_number": 1,
      "description": "Read the CSV file and load data",
      "action": "file_read(path='sales_data.csv')",
      "expected_output": "CSV content loaded into memory",
      "depends_on": []
    },
    {
      "step_number": 2,
      "description": "Write Python code to parse CSV and calculate totals",
      "action": "code_interpreter(language='python', code='...')",
      "expected_output": "Python script that processes data",
      "depends_on": [1]
    },
    {
      "step_number": 3,
      "description": "Execute Python script to generate report",
      "action": "code_interpreter(execute=true)",
      "expected_output": "Sales report with totals and averages",
      "depends_on": [2]
    },
    {
      "step_number": 4,
      "description": "Save report to file",
      "action": "file_write(path='sales_report.txt', content='...')",
      "expected_output": "Report saved successfully",
      "depends_on": [3]
    }
  ],
  "estimated_time": "2-3 minutes",
  "required_tools": ["file_read", "file_write", "code_interpreter"],
  "risks": [
    "CSV file might not exist or be malformed",
    "Python script might have errors",
    "Insufficient permissions to write file"
  ]
}
```

---

#### User Confirmation Flow

**Frontend Component** (`PlanApprovalDialog.tsx`):

```tsx
interface PlanApprovalDialogProps {
  plan: Plan;
  onApprove: () => void;
  onReject: () => void;
  onModify: (modifiedPlan: Plan) => void;
}

export function PlanApprovalDialog({ plan, onApprove, onReject, onModify }: PlanApprovalDialogProps) {
  return (
    <Dialog>
      <DialogHeader>
        <h3>Plan Approval Required</h3>
        <p>Goal: {plan.goal}</p>
        <Badge>Est. Time: {plan.estimated_time}</Badge>
      </DialogHeader>

      <DialogContent>
        {/* Step List */}
        <div className="steps">
          {plan.steps.map((step, idx) => (
            <StepCard key={idx} step={step} />
          ))}
        </div>

        {/* Required Tools */}
        <div className="tools">
          <h4>Required Tools:</h4>
          {plan.required_tools.map(tool => (
            <Badge variant="secondary">{tool}</Badge>
          ))}
        </div>

        {/* Risks */}
        {plan.risks.length > 0 && (
          <Alert variant="warning">
            <AlertTitle>Potential Risks</AlertTitle>
            <ul>
              {plan.risks.map(risk => <li>{risk}</li>)}
            </ul>
          </Alert>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onReject}>Reject</Button>
        <Button variant="secondary" onClick={() => setEditing(true)}>Modify</Button>
        <Button onClick={onApprove}>Approve & Execute</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

**Backend Command** (`commands/planner.rs`):

```rust
#[tauri::command]
pub async fn planner_generate_plan(
    state: State<'_, AppState>,
    goal: String,
) -> Result<Plan, String> {
    let planner = Planner::new(state.llm_client.clone());
    planner.generate_plan(&goal).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn planner_execute_plan(
    state: State<'_, AppState>,
    plan: Plan,
) -> Result<PlanExecution, String> {
    let planner = Planner::new(state.llm_client.clone());
    planner.execute_plan(&plan).await
        .map_err(|e| e.to_string())
}
```

---

#### Progress Tracking

**Frontend Component** (`PlanProgressTracker.tsx`):

```tsx
export function PlanProgressTracker({ execution }: { execution: PlanExecution }) {
  return (
    <div className="progress-tracker">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${execution.progress_percent}%` }}
        />
      </div>

      <div className="steps">
        {execution.plan.steps.map((step, idx) => (
          <div className={`step ${step.status}`}>
            <div className="step-header">
              <StatusIcon status={step.status} />
              <span>Step {step.step_number}: {step.description}</span>
            </div>

            {step.status === 'in_progress' && (
              <Spinner />
            )}

            {step.status === 'completed' && step.output && (
              <div className="step-output">
                <pre>{step.output}</pre>
              </div>
            )}

            {step.status === 'failed' && step.error && (
              <Alert variant="destructive">
                {step.error}
              </Alert>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Code Interpreter (v3.8.0)

### 4.1 Python Sandbox Runtime

#### Sandboxed Execution Environment

**Objective**: Run user-generated Python code safely in isolated environment

**Implementation Options**:

**Option A: Pyodide (WebAssembly)**
- Pros: True isolation, runs in browser
- Cons: Limited stdlib, slower execution

**Option B: Docker Containers**
- Pros: Full Python, better performance
- Cons: Requires Docker, more complex setup

**Option C: RustPython (Embedded)**
- Pros: Native Rust integration, good isolation
- Cons: Incomplete Python compatibility

**Recommended: Docker with Resource Limits**

**Implementation** (`services/python_sandbox.rs`):

```rust
use bollard::Docker;
use bollard::container::{Config, CreateContainerOptions};

pub struct PythonSandbox {
    docker_client: Docker,
    image_name: String,  // "python:3.11-slim"
    timeout_seconds: u64,
    memory_limit_mb: u64,
    cpu_quota: i64,
}

pub struct SandboxConfig {
    pub allowed_imports: Vec<String>,
    pub network_enabled: bool,
    pub file_system_access: bool,
    pub max_execution_time: u64,
    pub max_memory_mb: u64,
}

impl PythonSandbox {
    // Execute Python code in sandbox
    pub async fn execute(&self,
        code: &str,
        config: &SandboxConfig) -> Result<ExecutionResult>;

    // Validate code before execution
    fn validate_code(&self, code: &str, config: &SandboxConfig) -> Result<()>;

    // Create Docker container
    async fn create_container(&self) -> Result<String>;

    // Execute code in container
    async fn run_in_container(&self,
        container_id: &str,
        code: &str) -> Result<ExecutionOutput>;

    // Cleanup container
    async fn cleanup_container(&self, container_id: &str) -> Result<()>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub stdout: String,
    pub stderr: String,
    pub return_code: i32,
    pub execution_time_ms: u64,
    pub memory_used_mb: f64,
    pub success: bool,
}
```

**Docker Container Config**:
```rust
Config {
    image: "python:3.11-slim",
    cmd: vec!["python", "-c", code],
    host_config: HostConfig {
        memory: 512 * 1024 * 1024,  // 512MB
        memory_swap: 512 * 1024 * 1024,
        cpu_quota: 50000,  // 50% of one core
        network_mode: "none",  // No network by default
        readonly_rootfs: true,
    },
    working_dir: "/sandbox",
}
```

**Allowed Libraries (Whitelist)**:
```python
# Standard library
import json, csv, math, statistics, datetime, random
from collections import Counter, defaultdict
from itertools import combinations, permutations

# Data processing
import numpy, pandas

# Web scraping (if network enabled)
import requests
from bs4 import BeautifulSoup

# Visualization
import matplotlib.pyplot as plt
```

**Banned Operations**:
```python
# File system (outside sandbox)
open('/etc/passwd')  # ❌

# Network (unless explicitly enabled)
import socket  # ❌

# Subprocess
import subprocess  # ❌

# Dangerous built-ins
eval(), exec(), compile()  # ❌
```

---

### 4.2 Code Generation & Execution

#### Automatic Code Generation

**Trigger Detection**:

```rust
pub struct CodeTriggerDetector {
    llm_client: OllamaClient,
}

impl CodeTriggerDetector {
    // Detect if query needs code execution
    pub async fn should_use_code(&self, query: &str) -> Result<bool>;

    // Classify code type needed
    pub async fn classify_code_type(&self, query: &str) -> CodeType;
}

pub enum CodeType {
    Math,          // "Calculate 15% of 2,345"
    DataAnalysis,  // "Analyze this CSV and find trends"
    WebScraping,   // "Get latest news from example.com"
    Visualization, // "Create a bar chart of sales data"
    General,       // Other Python tasks
}
```

**Code Generation Prompt**:
```
Generate Python code to solve the following task:

Task: {user_query}

Available Libraries: numpy, pandas, matplotlib, requests, beautifulsoup4

Requirements:
- Write clean, well-commented code
- Handle errors gracefully
- Print results to stdout
- Do NOT use file I/O unless specifically requested
- Keep code under 100 lines

Format your response as:
```python
# Your code here
```

Example:
Task: Calculate the mean and standard deviation of [1, 2, 3, 4, 5]
```python
import statistics

data = [1, 2, 3, 4, 5]
mean = statistics.mean(data)
std_dev = statistics.stdev(data)

print(f"Mean: {mean}")
print(f"Standard Deviation: {std_dev:.2f}")
```
```

**Code Execution Pipeline**:

```rust
pub struct CodeInterpreter {
    sandbox: PythonSandbox,
    llm_client: OllamaClient,
    max_retries: usize,
}

impl CodeInterpreter {
    // Full pipeline: generate → validate → execute → format
    pub async fn interpret(&self, query: &str) -> Result<InterpretationResult>;

    // Generate Python code
    async fn generate_code(&self, query: &str) -> Result<String>;

    // Validate code syntax
    fn validate_syntax(&self, code: &str) -> Result<()>;

    // Execute code in sandbox
    async fn execute_code(&self, code: &str) -> Result<ExecutionResult>;

    // Handle execution errors and retry
    async fn handle_error_and_retry(&self,
        query: &str,
        code: &str,
        error: &str,
        attempt: usize) -> Result<String>;

    // Format result for user
    fn format_result(&self, result: &ExecutionResult) -> String;
}
```

**Error Handling & Retry**:
```rust
async fn handle_error_and_retry(&self, ...) -> Result<String> {
    if attempt >= self.max_retries {
        return Err("Max retries exceeded");
    }

    // Generate fix based on error
    let fix_prompt = format!(
        "The following Python code has an error:\n\n\
         ```python\n{}\n```\n\n\
         Error: {}\n\n\
         Fix the code and return corrected version:",
        code, error
    );

    let fixed_code = self.llm_client.generate(&fix_prompt).await?;

    Ok(fixed_code)
}
```

---

### 4.3 Use Cases & Examples

#### Example 1: Mathematical Calculation

**User Query**:
```
Calculate the compound interest on $10,000 at 5% annual rate for 10 years
```

**Generated Code**:
```python
principal = 10000
rate = 0.05
years = 10

# Compound interest formula: A = P(1 + r)^t
amount = principal * (1 + rate) ** years
interest = amount - principal

print(f"Principal: ${principal:,.2f}")
print(f"Interest Rate: {rate * 100}%")
print(f"Years: {years}")
print(f"Final Amount: ${amount:,.2f}")
print(f"Total Interest: ${interest:,.2f}")
```

**Output**:
```
Principal: $10,000.00
Interest Rate: 5.0%
Years: 10
Final Amount: $16,288.95
Total Interest: $6,288.95
```

---

#### Example 2: Data Analysis

**User Query**:
```
I have sales data: [120, 135, 110, 145, 160, 155, 170, 165].
Calculate the average, growth rate, and predict next month's sales using linear regression.
```

**Generated Code**:
```python
import numpy as np
from sklearn.linear_model import LinearRegression

# Sales data
sales = np.array([120, 135, 110, 145, 160, 155, 170, 165])
months = np.array(range(1, len(sales) + 1)).reshape(-1, 1)

# Calculate average
average = np.mean(sales)

# Calculate growth rate
growth_rate = ((sales[-1] - sales[0]) / sales[0]) * 100

# Linear regression for prediction
model = LinearRegression()
model.fit(months, sales)
next_month = model.predict([[len(sales) + 1]])[0]

print(f"Average Sales: ${average:.2f}")
print(f"Overall Growth Rate: {growth_rate:.1f}%")
print(f"Predicted Next Month: ${next_month:.2f}")
print(f"Trend: {'Upward' if model.coef_[0] > 0 else 'Downward'}")
```

**Output**:
```
Average Sales: $145.00
Overall Growth Rate: 37.5%
Predicted Next Month: $176.25
Trend: Upward
```

---

#### Example 3: Web Scraping

**User Query**:
```
Get the top 3 trending topics from Hacker News
```

**Generated Code**:
```python
import requests
from bs4 import BeautifulSoup

url = "https://news.ycombinator.com/"
response = requests.get(url, timeout=10)
soup = BeautifulSoup(response.text, 'html.parser')

# Extract top 3 stories
stories = soup.select('.titleline > a')[:3]

print("Top 3 Hacker News Stories:")
print("-" * 50)

for i, story in enumerate(stories, 1):
    title = story.text
    link = story['href']
    print(f"{i}. {title}")
    print(f"   {link}")
    print()
```

**Output**:
```
Top 3 Hacker News Stories:
--------------------------------------------------
1. Show HN: I built a local-first AI assistant
   https://example.com/ai-assistant

2. New breakthrough in quantum computing
   https://example.com/quantum

3. The end of Moore's Law?
   https://example.com/moores-law
```

---

## Phase 5: Self-Correction & Reflection (v3.8.0)

### 5.1 Multi-Pass Generation

#### Self-Critique Framework

**Objective**: LLM reviews and improves its own answers

**Implementation** (`services/self_correction.rs`):

```rust
pub struct SelfCorrectionEngine {
    llm_client: OllamaClient,
    critique_iterations: usize,  // Default: 2
}

pub struct CritiqueResult {
    pub original_answer: String,
    pub critique: String,
    pub issues_found: Vec<Issue>,
    pub improved_answer: String,
    pub confidence_before: f32,
    pub confidence_after: f32,
}

#[derive(Debug, Clone)]
pub struct Issue {
    pub issue_type: IssueType,
    pub description: String,
    pub severity: Severity,
    pub suggestion: String,
}

pub enum IssueType {
    LogicalInconsistency,
    FactualError,
    Incomplete,
    UnclearExplanation,
    MissingContext,
}

pub enum Severity {
    Critical,  // Must fix
    Major,     // Should fix
    Minor,     // Nice to fix
}

impl SelfCorrectionEngine {
    // Self-correction pipeline
    pub async fn correct(&self,
        query: &str,
        initial_answer: &str,
        context: &RAGContext) -> Result<CritiqueResult>;

    // Generate critique
    async fn generate_critique(&self,
        query: &str,
        answer: &str,
        context: &RAGContext) -> Result<Critique>;

    // Generate improved answer
    async fn generate_improvement(&self,
        query: &str,
        answer: &str,
        critique: &Critique) -> Result<String>;

    // Calculate confidence score
    async fn calculate_confidence(&self,
        answer: &str,
        context: &RAGContext) -> f32;
}
```

**Critique Prompt**:
```
You are reviewing an AI assistant's answer for quality.

Original Query: {query}

AI's Answer: {answer}

Available Context: {rag_context}

Critique the answer by checking for:
1. **Logical Consistency**: Does the reasoning make sense?
2. **Factual Accuracy**: Is information correct based on context?
3. **Completeness**: Does it fully answer the question?
4. **Clarity**: Is the explanation clear and understandable?
5. **Context Usage**: Did it use the provided context appropriately?

Format your response as JSON:
{
  "issues": [
    {
      "type": "LogicalInconsistency|FactualError|Incomplete|UnclearExplanation|MissingContext",
      "description": "What's wrong",
      "severity": "Critical|Major|Minor",
      "suggestion": "How to fix"
    }
  ],
  "overall_assessment": "Brief summary of quality",
  "confidence": 0.0-1.0
}
```

**Improvement Prompt**:
```
Improve the following answer based on the critique:

Original Query: {query}
Original Answer: {answer}

Critique:
{critique}

Rewrite the answer addressing all issues. Make it:
- Logically sound
- Factually accurate (use context)
- Complete and thorough
- Clear and well-explained

Improved Answer:
```

---

### 5.2 Verification Tools

#### Fact-Checking Against RAG

```rust
pub struct FactChecker {
    rag_service: RAGService,
    llm_client: OllamaClient,
}

impl FactChecker {
    // Verify factual claims in answer
    pub async fn verify_facts(&self,
        answer: &str,
        context: &RAGContext) -> Result<VerificationResult>;

    // Extract factual claims
    async fn extract_claims(&self, answer: &str) -> Vec<Claim>;

    // Check each claim against RAG memory
    async fn check_claim(&self, claim: &Claim) -> ClaimVerification;
}

pub struct ClaimVerification {
    pub claim: String,
    pub supported: bool,
    pub confidence: f32,
    pub evidence: Vec<String>,
}
```

---

#### Consistency Checking

```rust
pub struct ConsistencyChecker {
    llm_client: OllamaClient,
}

impl ConsistencyChecker {
    // Check if answer is consistent with conversation history
    pub async fn check_consistency(&self,
        answer: &str,
        conversation_history: &[Message]) -> Result<ConsistencyReport>;

    // Find contradictions
    async fn find_contradictions(&self,
        answer: &str,
        history: &[Message]) -> Vec<Contradiction>;
}

pub struct Contradiction {
    pub current_statement: String,
    pub previous_statement: String,
    pub message_id: String,
    pub severity: f32,
}
```

---

### 5.3 Confidence Scoring

#### Confidence Calculation

```rust
pub struct ConfidenceScorer {
    llm_client: OllamaClient,
}

impl ConfidenceScorer {
    // Calculate overall confidence score
    pub async fn score(&self, answer: &str, context: &RAGContext) -> f32;

    // Component scores
    async fn score_factual_grounding(&self, answer: &str, context: &RAGContext) -> f32;
    async fn score_logical_coherence(&self, answer: &str) -> f32;
    async fn score_completeness(&self, answer: &str, query: &str) -> f32;
    async fn score_specificity(&self, answer: &str) -> f32;
}
```

**Confidence Formula**:
```
confidence = 0.3 × factual_grounding
           + 0.3 × logical_coherence
           + 0.2 × completeness
           + 0.2 × specificity
```

**Confidence Thresholds**:
- `0.9-1.0`: Very confident, high quality answer
- `0.7-0.9`: Confident, good answer
- `0.5-0.7`: Moderate, answer might need improvement
- `<0.5`: Low confidence, should trigger self-correction

---

## Implementation Roadmap

### Timeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     v3.6.0 - 3 weeks                         │
├─────────────────────────────────────────────────────────────┤
│ Week 1: Hybrid Search + Re-ranking                          │
│ Week 2: Attention Sink + Token Counting                     │
│ Week 3: Prompt Caching + Testing                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     v3.7.0 - 4 weeks                         │
├─────────────────────────────────────────────────────────────┤
│ Week 1: GraphRAG Entity Extraction                          │
│ Week 2: GraphRAG Retrieval + Integration                    │
│ Week 3: ReAct Pattern + Planner                             │
│ Week 4: User Confirmation UI + Testing                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     v3.8.0 - 3 weeks                         │
├─────────────────────────────────────────────────────────────┤
│ Week 1: Python Sandbox + Code Generation                    │
│ Week 2: Self-Correction + Reflection                        │
│ Week 3: Integration Testing + Documentation                 │
└─────────────────────────────────────────────────────────────┘

Total: 10 weeks
```

---

### Phase Breakdown

#### **v3.6.0: Performance & Search** (Weeks 1-3)

**Week 1: Hybrid Search**
- [ ] Implement BM25 indexing (`bm25.rs`)
- [ ] Add hybrid fusion with RRF (`hybrid_search.rs`)
- [ ] Integrate cross-encoder re-ranker (`reranker.rs`)
- [ ] Download and integrate ms-marco-MiniLM model
- [ ] Unit tests for search pipeline

**Week 2: Context Management**
- [ ] Implement attention sink (`attention_sink.rs`)
- [ ] Add token counting (`token_counter.rs`)
- [ ] Context window monitoring and alerts
- [ ] Dynamic context compression
- [ ] Integration with Ollama client

**Week 3: Caching & Optimization**
- [ ] Implement prompt cache (`prompt_cache.rs`)
- [ ] Add batch inference support (`batch_inference.rs`)
- [ ] Performance benchmarking
- [ ] Memory optimization
- [ ] Documentation updates

**Deliverables**:
- 30% better RAG precision
- 50% faster responses with caching
- Support for 100K+ token conversations
- Performance benchmark report

---

#### **v3.7.0: Reasoning & Planning** (Weeks 4-7)

**Week 4: GraphRAG Foundation**
- [ ] Entity extraction service (`entity_extractor.rs`)
- [ ] Database schema for knowledge graph
- [ ] Entity and relationship storage
- [ ] Graph construction pipeline
- [ ] Community detection

**Week 5: Graph Retrieval**
- [ ] Multi-hop graph traversal (`graphrag.rs`)
- [ ] Hybrid vector + graph retrieval
- [ ] Context formatting for LLM
- [ ] Importance scoring
- [ ] Integration with RAG pipeline

**Week 6: ReAct & Planning**
- [ ] ReAct agent implementation (`react_agent.rs`)
- [ ] Thought-action-observation loop
- [ ] Planner service (`planner.rs`)
- [ ] Plan generation and validation
- [ ] Error handling and re-planning

**Week 7: User Confirmation UI**
- [ ] Plan approval dialog component
- [ ] Progress tracking component
- [ ] Step visualization
- [ ] Tauri commands for planning
- [ ] End-to-end testing

**Deliverables**:
- Context-aware knowledge graph
- Structured reasoning with ReAct
- User-approved plan execution
- Multi-hop information retrieval

---

#### **v3.8.0: Code Execution & Quality** (Weeks 8-10)

**Week 8: Python Sandbox**
- [ ] Docker-based sandbox (`python_sandbox.rs`)
- [ ] Security hardening and limits
- [ ] Code generation pipeline (`code_interpreter.rs`)
- [ ] Error handling and retry logic
- [ ] Library whitelist enforcement

**Week 9: Self-Correction**
- [ ] Self-critique framework (`self_correction.rs`)
- [ ] Fact-checking against RAG
- [ ] Consistency checking
- [ ] Confidence scoring
- [ ] Multi-pass generation

**Week 10: Integration & Polish**
- [ ] End-to-end testing all features
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] User guide and examples

**Deliverables**:
- Sandboxed Python execution
- Self-improving answers
- Confidence-aware responses
- Comprehensive documentation

---

## Technical Architecture

### New Services (Rust Backend)

```
src-tauri/src/services/
├── bm25.rs                    # Lexical search
├── hybrid_search.rs           # BM25 + Semantic fusion
├── reranker.rs                # Cross-encoder re-ranking
├── attention_sink.rs          # Long context management
├── prompt_cache.rs            # Prompt caching system
├── token_counter.rs           # Token counting
├── batch_inference.rs         # Batch processing
├── entity_extractor.rs        # Entity extraction
├── graph_builder.rs           # Knowledge graph construction
├── graphrag.rs                # Graph-enhanced retrieval
├── react_agent.rs             # ReAct pattern
├── planner.rs                 # Plan-and-Solve
├── python_sandbox.rs          # Sandboxed execution
├── code_interpreter.rs        # Code generation pipeline
├── self_correction.rs         # Multi-pass refinement
├── reflection.rs              # Self-critique
└── confidence_scorer.rs       # Confidence calculation
```

### New Commands

```
src-tauri/src/commands/
├── hybrid_search.rs           # Hybrid search commands
├── graphrag.rs                # Graph retrieval commands
├── planner.rs                 # Planning commands
├── code_interpreter.rs        # Code execution commands
└── reflection.rs              # Self-correction commands
```

### New Database Tables

```sql
-- BM25 Index
CREATE TABLE bm25_index (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    term TEXT NOT NULL,
    frequency INTEGER NOT NULL,
    document_length INTEGER NOT NULL
);

-- Knowledge Graph
CREATE TABLE kg_entities (...);
CREATE TABLE kg_relationships (...);
CREATE TABLE kg_entity_documents (...);
CREATE TABLE kg_communities (...);

-- Plan Executions
CREATE TABLE plan_executions (...);
CREATE TABLE plan_steps (...);

-- Code Executions
CREATE TABLE code_executions (...);

-- Prompt Cache
CREATE TABLE prompt_cache (
    prompt_hash TEXT PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    kv_cache BLOB,
    access_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_accessed INTEGER NOT NULL
);
```

### New Frontend Components

```
src/renderer/components/
├── planning/
│   ├── PlanApprovalDialog.tsx
│   ├── PlanProgressTracker.tsx
│   └── StepCard.tsx
├── code/
│   ├── CodeExecutionViewer.tsx
│   ├── CodeEditor.tsx
│   └── ExecutionOutput.tsx
└── knowledge/
    ├── KnowledgeGraphViewer.tsx  (optional)
    └── EntityCard.tsx
```

---

## Success Metrics

### Performance Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Response Time (simple) | 3-4s | <2s | Avg time from query to response |
| Response Time (RAG) | 5-6s | <3s | With context retrieval |
| RAG Precision@3 | 0.65 | 0.85 | Relevant docs in top-3 |
| Context Window Usage | 80% | 50% | With attention sink |
| Cache Hit Rate | 0% | 40% | Prompt cache effectiveness |
| Token Count Accuracy | N/A | 95% | Within 5% of actual |

### Quality Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Factual Accuracy | 0.75 | 0.90 | Verified against RAG |
| Answer Completeness | 0.70 | 0.85 | User satisfaction score |
| Self-Correction Improvement | N/A | +20% | Quality delta after critique |
| Code Execution Success | N/A | 85% | Successful runs / total |
| Plan Completion Rate | N/A | 90% | Plans completed / approved |

### User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plan Approval Rate | >80% | Approved plans / generated |
| User Satisfaction (Plans) | >4.0/5.0 | Rating after execution |
| Code Understanding | >4.0/5.0 | Rating of generated code |
| Error Recovery Rate | >90% | Successful retries / failures |
| Confidence Transparency | >4.0/5.0 | User finds confidence helpful |

---

## Security Considerations

### Python Sandbox Security

**Isolation**:
- ✅ Run in Docker container
- ✅ No network access by default
- ✅ Read-only root filesystem
- ✅ Limited CPU and memory
- ✅ Execution timeout (30s)

**Allowed Operations**:
- ✅ Pure computation (math, data processing)
- ✅ Whitelisted libraries only
- ✅ Limited file I/O (sandbox directory)
- ✅ Network requests (if explicitly enabled)

**Banned Operations**:
- ❌ System calls (os, sys, subprocess)
- ❌ Dynamic code execution (eval, exec, compile)
- ❌ File system access outside sandbox
- ❌ Network sockets
- ❌ Import arbitrary modules

**Audit Logging**:
```rust
pub struct CodeAuditLog {
    pub execution_id: String,
    pub user_id: String,
    pub code: String,
    pub execution_time: SystemTime,
    pub success: bool,
    pub output: String,
    pub risk_level: RiskLevel,
}

pub enum RiskLevel {
    Low,     // Simple math
    Medium,  // Data processing
    High,    // Network requests, file I/O
}
```

---

### GraphRAG Privacy

**PII Detection**:
```rust
pub struct PIIDetector {
    patterns: Vec<Regex>,
}

impl PIIDetector {
    // Detect PII in entity names
    pub fn contains_pii(&self, text: &str) -> bool;

    // Anonymize PII
    pub fn anonymize(&self, text: &str) -> String;
}
```

**Sensitive Entities**:
- Email addresses
- Phone numbers
- Social security numbers
- Credit card numbers
- API keys and tokens

**Access Control**:
```rust
pub struct EntityAccessControl {
    pub entity_id: String,
    pub visibility: EntityVisibility,
    pub owner: String,
}

pub enum EntityVisibility {
    Public,     // Available to all
    Private,    // Only owner
    Shared,     // Specific users
}
```

---

### Code Generation Safety

**Pre-Execution Validation**:
```rust
pub struct CodeValidator {
    banned_imports: Vec<String>,
    banned_functions: Vec<String>,
}

impl CodeValidator {
    // Validate code before execution
    pub fn validate(&self, code: &str) -> Result<ValidationResult>;

    // Check for banned imports
    fn check_imports(&self, code: &str) -> Vec<String>;

    // Check for dangerous functions
    fn check_functions(&self, code: &str) -> Vec<String>;

    // Parse and analyze AST
    fn analyze_ast(&self, code: &str) -> ASTAnalysis;
}

pub struct ValidationResult {
    pub safe: bool,
    pub issues: Vec<SafetyIssue>,
    pub risk_score: f32,
}
```

**User Confirmation for Risky Code**:
```tsx
{riskLevel === 'high' && (
  <Alert variant="warning">
    <AlertTitle>⚠️ High-Risk Code Detected</AlertTitle>
    <p>This code will perform network requests. Do you want to proceed?</p>
    <Button onClick={approveExecution}>Yes, Execute</Button>
  </Alert>
)}
```

---

## Documentation Deliverables

### 1. ADVANCED_FEATURES.md (This Document)
- Overview of all features
- Implementation details
- Architecture diagrams
- Success metrics

### 2. GRAPHRAG_GUIDE.md
- Knowledge graph concepts
- Entity extraction guide
- Graph querying examples
- Best practices

### 3. REACT_PATTERNS.md
- ReAct framework explanation
- Tool calling patterns
- Multi-turn agentic loops
- Error handling

### 4. PYTHON_SANDBOX.md
- Sandbox setup instructions
- Security configuration
- Allowed/banned operations
- Troubleshooting

### 5. SELF_CORRECTION.md
- Self-critique framework
- Confidence scoring
- Fact-checking process
- Quality improvement tips

### 6. API_REFERENCE.md
- All new Tauri commands
- Request/response formats
- Error codes
- Usage examples

---

## Development Guidelines

### Code Quality Standards

**Rust Code**:
- Follow Rust conventions and idioms
- Write comprehensive unit tests (>80% coverage)
- Document all public APIs with doc comments
- Use `Result<T, E>` for error handling
- Prefer async/await over callbacks

**TypeScript Code**:
- Use TypeScript strict mode
- Write unit tests with Jest/Vitest
- Follow React best practices
- Use Tailwind for styling
- Prefer functional components

**Documentation**:
- Clear, concise explanations
- Code examples for all features
- Architecture diagrams where helpful
- Troubleshooting sections

---

### Testing Strategy

**Unit Tests**:
- Test each service independently
- Mock external dependencies
- Cover edge cases and errors
- Aim for >80% coverage

**Integration Tests**:
- Test service interactions
- Validate database operations
- Check command pipelines
- Verify event handling

**End-to-End Tests**:
- Test complete user flows
- Validate UI interactions
- Check error handling
- Performance benchmarks

**Security Tests**:
- Sandbox escape attempts
- Malicious code injection
- Resource exhaustion
- Access control validation

---

### Performance Optimization

**Profiling**:
- Use `cargo flamegraph` for Rust profiling
- Chrome DevTools for frontend profiling
- Identify bottlenecks
- Optimize hot paths

**Caching Strategy**:
- Cache prompt embeddings
- Cache search results (5 min TTL)
- Cache graph queries
- Invalidate on updates

**Database Optimization**:
- Index frequently queried columns
- Use prepared statements
- Batch operations where possible
- Regular VACUUM for SQLite

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Create this planning document
2. ✅ Get user approval
3. 🔄 Set up development branches:
   - `feature/v3.6.0-hybrid-search`
   - `feature/v3.7.0-graphrag`
   - `feature/v3.8.0-code-interpreter`
4. 🔄 Create GitHub issues for each task
5. 🔄 Set up project board with milestones

### Week 1 Goals

- [ ] Implement BM25 indexing
- [ ] Add RRF fusion
- [ ] Integrate cross-encoder model
- [ ] Write unit tests
- [ ] Document hybrid search API

---

## Conclusion

This roadmap transforms Garden of Eden V3 from a capable AI assistant into an enterprise-grade system with:

✅ **Performance**: Sub-3s responses, efficient context handling
✅ **Intelligence**: Multi-hop reasoning, structured planning
✅ **Capabilities**: Code execution, web scraping, data analysis
✅ **Reliability**: Self-correction, verification, confidence scoring

**Total Estimated Timeline**: 10 weeks
**Priority**: High - these features are essential for production use
**Risk**: Medium - well-defined scope, proven technologies

Let's build the future of AI assistants! 🚀
