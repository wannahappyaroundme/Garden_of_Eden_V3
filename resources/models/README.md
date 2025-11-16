# AI Models

This directory contains AI model configurations for Garden of Eden V3.

**Note**: Models are NOT stored in this directory. They are downloaded and managed by Ollama at `~/.ollama/models/` (macOS/Linux) or `%USERPROFILE%\.ollama\models\` (Windows).

## Models

### qwen2.5:7b (Primary LLM - Recommended for 12-19GB RAM)
- **Purpose**: Conversation generation, reasoning, code assistance, excellent Korean language support
- **Size**: ~4.7 GB
- **Format**: GGUF (via Ollama)
- **Model ID**: `qwen2.5:7b`
- **Languages**: 29+ languages including Korean (native multilingual)
- **Context**: 32K tokens
- **Parameters**: 7 billion (Alibaba Qwen 2.5)
- **Performance**: 3-4 second responses on modern hardware
- **Reasoning**: MMLU ~74% (+5% vs phi3:mini)
- **Overfitting Prevention**:
  - Temperature: 0.8
  - Top-P: 0.92
  - Top-K: 45
  - Repeat Penalty: 1.15

### qwen2.5:3b (Lightweight Alternative - For 8-11GB RAM)
- **Purpose**: Lightweight conversation, basic tasks
- **Size**: ~2.0 GB
- **Model ID**: `qwen2.5:3b`
- **Languages**: 29+ languages including Korean
- **Context**: 32K tokens
- **Parameters**: 3 billion
- **Performance**: 2-3 second responses
- **RAM usage**: ~4-5 GB

### Whisper Large V3 (Optional)
- **Purpose**: Speech-to-text (Korean + English)
- **Size**: ~3.1 GB
- **Format**: GGML binary (via Ollama or standalone)
- **Model ID**: `whisper:large-v3` (if using Ollama)
- **Note**: Optional, only needed for voice input feature

## Download

Models are downloaded automatically during onboarding or manually via Ollama:

```bash
# Primary LLM (required) - Choose based on your RAM
ollama pull qwen2.5:7b   # For 12-19GB RAM systems
ollama pull qwen2.5:3b   # For 8-11GB RAM systems

# Voice input (optional)
ollama pull whisper:large-v3
```

Or use the built-in download UI during first launch.

## Total Size

- **Minimum** (text-only, 8-11GB RAM): ~2.0 GB (qwen2.5:3b only)
- **Recommended** (text-only, 12-19GB RAM): ~4.7 GB (qwen2.5:7b)
- **With voice input**: ~7.8 GB (qwen2.5:7b + whisper)

## Model Sources

All models are from official sources via Ollama:
- **qwen2.5:7b**: Alibaba Qwen 2.5 via Ollama (ollama.ai/library/qwen2.5)
- **qwen2.5:3b**: Alibaba Qwen 2.5 3B via Ollama
- **Whisper Large V3**: OpenAI Whisper via Ollama (ollama.ai/library/whisper)

## License

Each model has its own license:
- **qwen2.5:7b / qwen2.5:3b**: Apache 2.0 License (commercial use allowed)
- **Whisper**: MIT License

## Performance Benchmarks

**qwen2.5:7b on Apple Silicon**:
- M1/M2/M3: 3-4 seconds per response
- Token generation: 40-50 tokens/sec
- RAM usage: ~6-8 GB
- **25% faster than phi3:mini with better quality**

**qwen2.5:7b on Intel/AMD**:
- High-end (i9/Ryzen 9): 3-5 seconds per response
- Mid-range (i7/Ryzen 7): 4-6 seconds per response
- Token generation: 30-40 tokens/sec
- RAM usage: ~6-8 GB

**qwen2.5:3b on Apple Silicon**:
- M1/M2/M3: 2-3 seconds per response
- Token generation: 60-80 tokens/sec
- RAM usage: ~4-5 GB

## RAM-Based Recommendations

| RAM Tier | Recommended Model | Size | RAM Usage | Response Time |
|----------|-------------------|------|-----------|---------------|
| 8-11GB | qwen2.5:3b | 2.0GB | 4-5GB | 2-3s |
| 12-19GB | **qwen2.5:7b** (default) | 4.7GB | 6-8GB | 3-4s |
| 20GB+ | qwen2.5:32b | 20GB | 18-22GB | 5-8s |
