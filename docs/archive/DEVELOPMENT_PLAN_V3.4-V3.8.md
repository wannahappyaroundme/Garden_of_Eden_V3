# Garden of Eden V3.4-V3.8 Development Plan
**Created**: 2025-01-18
**Timeline**: 12 weeks (3 months)
**Status**: In Progress

---

## 📅 Timeline Overview

```
Week 1-2   : Auto-updater + Crash Reporting → v3.4.0
Week 3-4   : Advanced RAG (BGE-M3 + LanceDB)
Week 5-6   : RAFT Hallucination Reduction
Week 7-9   : LLaVA Full Integration → v3.5.0
Week 10-11 : Proactive AI Mode → v3.6.0
Week 12    : Plugin Marketplace → v3.7.0
```

---

## 🎯 Week 1-2: Auto-updater + Crash Reporting (v3.4.0)

### Goal
Implement production-ready update system and crash reporting infrastructure.

### Deliverables

#### 1. Auto-updater System (Week 1)
**Backend Tasks**:
- [ ] Configure Tauri updater in `tauri.conf.json`
- [ ] Create update server endpoint (GitHub Releases)
- [ ] Implement version comparison logic
- [ ] Add update check on app startup
- [ ] Add manual update check command
- [ ] Create update download progress tracking
- [ ] Implement background update installation
- [ ] Add rollback mechanism for failed updates

**Frontend Tasks**:
- [ ] Create UpdateNotification component
- [ ] Add update progress modal
- [ ] Implement "Update Available" badge
- [ ] Add Settings > Updates panel
- [ ] Create update history view
- [ ] Add "Check for Updates" button

**Files to Create/Modify**:
```
src-tauri/tauri.conf.json (updater config)
src-tauri/src/commands/updater.rs (enhance existing)
src/renderer/components/UpdateNotification.tsx (new)
src/renderer/pages/UpdateSettings.tsx (new)
```

**Testing**:
- [ ] Test update check on startup
- [ ] Test manual update trigger
- [ ] Test update download with slow network
- [ ] Test update installation (macOS)
- [ ] Test rollback on installation failure

---

#### 2. Enhanced Crash Reporting (Week 1)

**Backend Tasks**:
- [ ] Enhance existing CrashReporterService
- [ ] Add panic handler with backtrace
- [ ] Implement local crash log storage
- [ ] Add crash report format (JSON)
- [ ] Create crash report upload (optional Sentry)
- [ ] Add crash statistics tracking
- [ ] Implement automatic crash detection
- [ ] Add user consent dialog for crash reports

**Frontend Tasks**:
- [ ] Create CrashReportDialog component
- [ ] Add crash report viewer in Settings
- [ ] Implement crash report upload UI
- [ ] Add crash statistics dashboard
- [ ] Create "Send Feedback" button with crash context

**Files to Create/Modify**:
```
src-tauri/src/services/crash_reporter.rs (enhance)
src-tauri/src/commands/crash_reporter.rs (enhance)
src/renderer/components/CrashReportDialog.tsx (new)
src/renderer/pages/CrashReports.tsx (new)
```

**Testing**:
- [ ] Trigger intentional panic and verify crash log
- [ ] Test crash report generation
- [ ] Test local crash log storage
- [ ] Test crash report viewer
- [ ] Test user consent flow

---

#### 3. Documentation & Release (Week 2)

- [ ] Update CHANGELOG.md for v3.4.0
- [ ] Create AUTO_UPDATER_GUIDE.md
- [ ] Create CRASH_REPORTING_GUIDE.md
- [ ] Update README.md roadmap
- [ ] Create GitHub release with binaries
- [ ] Test update flow from v3.3.1 → v3.4.0

---

## 🧠 Week 3-4: Advanced RAG (BGE-M3 + LanceDB)

### Goal
Replace TF-IDF with BGE-M3 embeddings and migrate to LanceDB vector database.

### Deliverables

#### 1. BGE-M3 Integration (Week 3)

**Backend Tasks**:
- [ ] Download BGE-M3 model (~2GB)
- [ ] Integrate `candle` or `ort` for inference
- [ ] Create BGEEmbeddingService
- [ ] Implement batch embedding generation
- [ ] Add embedding caching mechanism
- [ ] Create migration script from TF-IDF to BGE-M3
- [ ] Benchmark embedding generation speed

**Files to Create**:
```
src-tauri/src/services/bge_embeddings.rs (new)
src-tauri/src/services/embedding_cache.rs (new)
scripts/migrate_embeddings.sh (new)
```

**Testing**:
- [ ] Test embedding generation accuracy
- [ ] Test batch processing (1000 messages)
- [ ] Compare semantic similarity vs TF-IDF
- [ ] Measure memory usage during inference

---

#### 2. LanceDB Integration (Week 3-4)

**Backend Tasks**:
- [ ] Add `lancedb` Rust dependency
- [ ] Create LanceDBService
- [ ] Implement vector index creation
- [ ] Add semantic similarity search
- [ ] Create hybrid search (keyword + vector)
- [ ] Implement data migration from SQLite
- [ ] Add vector index optimization
- [ ] Create backup/restore for LanceDB

**Files to Create**:
```
src-tauri/src/services/lancedb.rs (new)
src-tauri/src/services/vector_search.rs (new)
src-tauri/src/database/lancedb_schema.rs (new)
scripts/migrate_to_lancedb.sh (new)
```

**Testing**:
- [ ] Test vector insertion (10K records)
- [ ] Test semantic search accuracy
- [ ] Test hybrid search performance
- [ ] Compare query speed vs SQLite
- [ ] Test migration script

---

#### 3. RAG Enhancement (Week 4)

**Backend Tasks**:
- [ ] Update RAG service to use LanceDB
- [ ] Implement re-ranking algorithm
- [ ] Add contextual compression
- [ ] Create smart chunking strategy
- [ ] Implement multi-query retrieval
- [ ] Add conversation-aware retrieval
- [ ] Optimize retrieval latency (<100ms)

**Files to Modify**:
```
src-tauri/src/services/rag.rs (major refactor)
src-tauri/src/services/chunking.rs (enhance)
```

**Testing**:
- [ ] Test retrieval accuracy (precision@5)
- [ ] Test retrieval speed
- [ ] Test multi-turn conversation context
- [ ] Compare with old TF-IDF RAG

---

## 🛡️ Week 5-6: RAFT Hallucination Reduction

### Goal
Implement full RAFT (Retrieval Augmented Fine-Tuning) system.

### Deliverables

#### 1. RAFT Service Enhancement (Week 5)

**Backend Tasks**:
- [ ] Replace stub with real hallucination detection
- [ ] Implement fact extraction from retrieved context
- [ ] Create fact verification logic
- [ ] Add confidence scoring for responses
- [ ] Implement response filtering
- [ ] Create synthetic training data generator
- [ ] Add RAFT-specific LoRA adapter

**Files to Modify**:
```
src-tauri/src/services/raft.rs (complete implementation)
src-tauri/src/services/fact_verification.rs (new)
```

**Testing**:
- [ ] Test hallucination detection accuracy
- [ ] Test fact extraction from context
- [ ] Test confidence scoring
- [ ] Measure false positive rate

---

#### 2. Training Pipeline (Week 6)

**Backend Tasks**:
- [ ] Create RAFT training data format
- [ ] Generate synthetic hallucination examples
- [ ] Train RAFT-specific LoRA adapter
- [ ] Implement adapter A/B testing
- [ ] Create evaluation metrics
- [ ] Optimize adapter parameters

**Files to Create**:
```
scripts/generate_raft_data.py (new)
scripts/train_raft_adapter.sh (new)
src-tauri/src/services/raft_trainer.rs (new)
```

**Testing**:
- [ ] Generate 10K training examples
- [ ] Train adapter (3-5 hours)
- [ ] Evaluate on test set
- [ ] Compare hallucination rate before/after

---

## 🖼️ Week 7-9: LLaVA Full Integration (v3.5.0)

### Goal
Deep screen analysis, multi-image conversations, UI/UX understanding.

### Deliverables

#### 1. LLaVA Service Enhancement (Week 7)

**Backend Tasks**:
- [ ] Download LLaVA 7B model (~4.4GB)
- [ ] Replace stub with full implementation
- [ ] Implement image preprocessing pipeline
- [ ] Add multi-image batch processing
- [ ] Create image caching system
- [ ] Optimize inference speed (GPU required)

**Files to Modify**:
```
src-tauri/src/services/llava.rs (complete rewrite)
src-tauri/src/services/image_preprocessor.rs (new)
```

---

#### 2. Multi-modal Conversations (Week 8)

**Backend Tasks**:
- [ ] Extend conversation schema for images
- [ ] Implement image message storage
- [ ] Create image-text interleaving
- [ ] Add image reference tracking
- [ ] Implement image context retrieval

**Database Changes**:
```sql
ALTER TABLE messages ADD COLUMN image_data BLOB;
ALTER TABLE messages ADD COLUMN image_metadata TEXT;
CREATE TABLE image_references (...);
```

---

#### 3. Advanced Vision Features (Week 9)

**Backend Tasks**:
- [ ] Screenshot annotation system
- [ ] UI/UX analysis (detect buttons, forms, etc.)
- [ ] Diagram understanding
- [ ] Code screenshot to text conversion
- [ ] Image editing suggestions

**Frontend Tasks**:
- [ ] Image upload component
- [ ] Image preview in chat
- [ ] Screenshot annotation UI
- [ ] Image gallery view

---

## 🤖 Week 10-11: Proactive AI Mode (v3.6.0)

### Goal
Fully autonomous AI that monitors screen and takes initiative.

### Deliverables

#### 1. Screen Monitoring System (Week 10)

**Backend Tasks**:
- [ ] Implement Level 2 context (10min window)
- [ ] Implement Level 3 context (full project)
- [ ] Add smart screen change detection
- [ ] Create activity classification
- [ ] Implement attention model
- [ ] Add error/warning detection

**Files to Create**:
```
src-tauri/src/services/screen_monitor.rs (enhance)
src-tauri/src/services/activity_classifier.rs (new)
src-tauri/src/services/attention_model.rs (new)
```

---

#### 2. Autonomous Decision Making (Week 11)

**Backend Tasks**:
- [ ] Implement interruption policy
- [ ] Create action suggestion system
- [ ] Add calendar auto-scheduling
- [ ] Implement email drafting
- [ ] Create task extraction from screen
- [ ] Add proactive notification system

**Frontend Tasks**:
- [ ] Proactive notification component
- [ ] Action approval dialog
- [ ] Autonomous mode toggle
- [ ] Activity timeline view

---

## 🔌 Week 12: Plugin Marketplace (v3.7.0)

### Goal
Community plugin discovery, signing, and installation.

### Deliverables

#### 1. Plugin Discovery System

**Backend Tasks**:
- [ ] GitHub API integration
- [ ] Plugin manifest parser
- [ ] Plugin signature verification
- [ ] Dependency resolution
- [ ] Plugin installation manager
- [ ] Plugin update checker

**Files to Create**:
```
src-tauri/src/services/plugin_marketplace.rs (new)
src-tauri/src/services/plugin_installer.rs (new)
src-tauri/src/services/plugin_verifier.rs (new)
```

---

#### 2. Plugin Signing Infrastructure

**Backend Tasks**:
- [ ] Generate signing keys
- [ ] Create plugin signing CLI
- [ ] Implement signature verification
- [ ] Add trusted publisher list
- [ ] Create plugin security sandbox

---

#### 3. Marketplace UI

**Frontend Tasks**:
- [ ] Plugin browser component
- [ ] Plugin detail page
- [ ] Plugin installation progress
- [ ] Installed plugins manager
- [ ] Plugin settings panel

---

## 📊 Success Metrics

### v3.4.0 Metrics
- [ ] Auto-update success rate > 95%
- [ ] Crash report capture rate > 90%
- [ ] Zero data loss during updates

### v3.5.0 Metrics
- [ ] RAG retrieval precision@5 > 80%
- [ ] Query latency < 100ms
- [ ] Hallucination rate < 5% (with RAFT)

### v3.6.0 Metrics
- [ ] LLaVA inference < 3s per image
- [ ] Screen analysis accuracy > 85%
- [ ] Multi-image conversation support

### v3.7.0 Metrics
- [ ] Proactive suggestion accuracy > 70%
- [ ] False positive interruption < 10%
- [ ] Plugin marketplace with 10+ community plugins

---

## 🚀 Release Schedule

| Version | Release Date | Features |
|---------|--------------|----------|
| v3.4.0 | Week 2 (Feb 1) | Auto-updater + Crash Reporting |
| v3.5.0 | Week 6 (Mar 1) | Advanced RAG + RAFT |
| v3.6.0 | Week 9 (Mar 22) | LLaVA Full Integration |
| v3.7.0 | Week 11 (Apr 5) | Proactive AI Mode |
| v3.8.0 | Week 12 (Apr 12) | Plugin Marketplace |

---

## ⚠️ Risks & Mitigation

### Technical Risks
1. **BGE-M3 Performance** - May be slow on CPU
   - Mitigation: Implement caching, batch processing
2. **LanceDB Migration** - Data loss risk
   - Mitigation: Backup before migration, rollback plan
3. **LLaVA GPU Requirements** - Not all users have GPU
   - Mitigation: CPU fallback, cloud option (opt-in)

### Timeline Risks
1. **Model Download Size** - BGE-M3 (2GB) + LLaVA (4.4GB)
   - Mitigation: Optional downloads, CDN hosting
2. **Feature Creep** - Scope expansion
   - Mitigation: Strict MVP for each week

---

## 📝 Next Steps (Starting Now)

### Immediate Actions (Today)
1. ✅ Create development plan document
2. ⏳ Implement Auto-updater configuration
3. ⏳ Enhance Crash Reporter service
4. ⏳ Create UpdateNotification component

### This Week
- [ ] Complete Auto-updater backend
- [ ] Create update notification UI
- [ ] Test update flow
- [ ] Write documentation

---

**Let's start with Week 1! 🚀**
