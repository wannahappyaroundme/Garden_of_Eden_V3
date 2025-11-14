# AI Models

This directory contains the AI models for Garden of Eden V3.

## Models

### Qwen 2.5 14B Instruct (Q4_K_M via Ollama)
- **Purpose**: Conversation generation, reasoning, code assistance, Korean language
- **Size**: ~9.0 GB
- **Format**: GGUF (quantized to Q4_K_M for optimal speed/quality balance)
- **File**: qwen2.5:14b (Ollama model reference)
- **Languages**: 29+ languages including Korean
- **Context**: 32K tokens
- **Fine-tuning**: Stable for continual learning (low catastrophic forgetting risk)

### Whisper Large V3
- **Purpose**: Speech-to-text (Korean + English)
- **Size**: ~3.1 GB
- **Format**: GGML binary
- **File**: whisper-large-v3.bin

### LLaVA 7B (Q4_K)
- **Purpose**: Screen analysis, image understanding
- **Size**: ~4.0 GB
- **Format**: GGUF (quantized to Q4_K)
- **File**: llava-7b-q4.gguf

## Download

Run the download script:

```bash
npm run download:models
```

Or download individual models:

```bash
npm run download:qwen
npm run download:whisper
npm run download:llava
```

## Total Size

~16.5 GB of disk space required.

## Model Sources

All models are from Hugging Face:
- Qwen 2.5 14B: Installed via Ollama (ollama.ai/library/qwen2.5)
- Whisper: OpenAI Whisper Large V3 (GGML format by ggerganov)
- LLaVA: LLaVA 1.5 7B (GGML format by mys)

## License

Each model has its own license. Please refer to the original model repositories.
- Qwen 2.5: Apache 2.0
- Whisper: MIT
- LLaVA: Apache 2.0
