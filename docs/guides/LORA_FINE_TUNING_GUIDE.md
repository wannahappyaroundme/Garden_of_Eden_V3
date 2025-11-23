# LoRA Fine-Tuning Guide for Garden of Eden V3

This guide explains how to fine-tune the Qwen 2.5 14B model using LoRA (Low-Rank Adaptation) to personalize the AI assistant based on your conversation history.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Collect Training Data](#step-1-collect-training-data)
4. [Step 2: Train LoRA Adapter](#step-2-train-lora-adapter)
5. [Step 3: Register Adapter](#step-3-register-adapter)
6. [Step 4: Load Adapter in Ollama](#step-4-load-adapter-in-ollama)
7. [Step 5: Monitor Performance](#step-5-monitor-performance)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Topics](#advanced-topics)

---

## Overview

**What is LoRA?**

LoRA (Low-Rank Adaptation) is a parameter-efficient fine-tuning method that allows you to adapt large language models with minimal computational resources. Instead of updating all 14 billion parameters of Qwen 2.5, LoRA only trains ~0.1% of the parameters, resulting in:

- **Faster training**: Hours instead of days
- **Lower memory usage**: 8-16GB VRAM instead of 80GB
- **Smaller checkpoints**: 50-200MB instead of 30GB+
- **Reversible**: Original model remains unchanged

**Why use LoRA for Garden of Eden?**

- **Personalization**: Adapt AI responses to your communication style
- **Domain adaptation**: Improve performance on specialized topics
- **Privacy**: Train on your local data without sharing with cloud services
- **Version control**: Manage multiple adapters for different personas

---

## Prerequisites

### Hardware Requirements

- **Minimum**: 16GB RAM, 8GB VRAM (NVIDIA GPU recommended)
- **Recommended**: 24GB RAM, 16GB VRAM (RTX 3090/4090, A4000, etc.)
- **Apple Silicon**: M1 Max/Ultra, M2 Max/Ultra, M3 Max (Metal support via MLX)

### Software Requirements

1. **Python 3.9+** with pip
2. **Git**
3. **Ollama** (already installed with Garden of Eden V3)
4. **LLaMA-Factory** (recommended) or Axolotl/UnSloth

### Install LLaMA-Factory

```bash
# Clone LLaMA-Factory repository
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory

# Install dependencies
pip install -e ".[torch,bitsandbytes,vllm]"

# For Apple Silicon (Metal support)
pip install -e ".[mlx]"
```

---

## Step 1: Collect Training Data

Garden of Eden V3 provides a **LoRA Data Collector Service** that exports high-quality conversations in formats compatible with fine-tuning frameworks.

### Export Training Data

Use the built-in service to export your conversation history:

```rust
// Example: Export training data to Alpaca format
use garden_of_eden_v3::services::lora_data_collector::{
    LoRADataCollectorService, TrainingFormat, DataFilter
};

// Create custom filter (optional)
let filter = DataFilter {
    min_satisfaction: 0.8,       // Only export high-quality conversations
    min_message_length: 20,      // Exclude trivial messages
    max_message_length: 3000,    // Exclude extremely long messages
    positive_only: true,         // Only positive feedback conversations
    exclude_negative: true,      // Exclude negative feedback
    min_turns: 2,                // Multi-turn conversations preferred
};

// Initialize collector
let collector = LoRADataCollectorService::with_filter(db, filter)?;

// Export to Alpaca format (recommended for instruction-following)
let metadata = collector.export_to_file(
    TrainingFormat::Alpaca,
    "/path/to/training_data.json",
    Some(1000) // Limit to 1000 examples
)?;

println!("Exported {} examples", metadata.total_examples);
println!("Average satisfaction: {:.2}", metadata.avg_satisfaction);
```

### Export via CLI (Future Enhancement)

```bash
# Export 1000 high-quality conversations to Alpaca format
garden-eden export-training-data \
  --format alpaca \
  --output ./training_data.json \
  --min-satisfaction 0.8 \
  --limit 1000
```

### Supported Formats

1. **Alpaca Format** (recommended for instruction-following)
   ```json
   {
     "instruction": "How do I implement error handling in Rust?",
     "input": "",
     "output": "In Rust, error handling is primarily done using Result<T, E>..."
   }
   ```

2. **ShareGPT Format** (multi-turn conversations)
   ```json
   {
     "conversations": [
       {"from": "human", "value": "What is LoRA?"},
       {"from": "gpt", "value": "LoRA is a parameter-efficient fine-tuning method..."}
     ]
   }
   ```

3. **JSONL Format** (raw format with metadata)
   ```jsonl
   {"system": "...", "user": "...", "assistant": "...", "satisfaction": 0.9}
   ```

---

## Step 2: Train LoRA Adapter

### Using LLaMA-Factory (Recommended)

LLaMA-Factory provides a simple CLI and Web UI for fine-tuning.

#### Option A: Web UI (Easiest)

```bash
cd LLaMA-Factory
python src/train_web.py
```

Then:
1. Open browser to `http://localhost:7860`
2. Select **Qwen2.5** model
3. Upload your `training_data.json` file
4. Configure LoRA parameters:
   - **Rank (r)**: 16 (default, higher = more capacity but slower)
   - **Alpha**: 32 (scaling factor, usually 2x rank)
   - **Dropout**: 0.05 (regularization)
   - **Target Modules**: `q_proj,v_proj` (attention layers)
5. Set training parameters:
   - **Epochs**: 3-5
   - **Batch Size**: 4-8 (adjust based on VRAM)
   - **Learning Rate**: 2e-4
   - **Warmup Ratio**: 0.03
6. Click **Train** and wait for completion (~1-3 hours for 1000 examples)

#### Option B: CLI (Advanced)

Create a training config file `lora_config.yaml`:

```yaml
### Model
model_name_or_path: Qwen/Qwen2.5-14B-Instruct

### Dataset
dataset: alpaca_data
dataset_dir: ./data
template: qwen

### LoRA
finetuning_type: lora
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05
lora_target: q_proj,v_proj

### Training
output_dir: ./saves/qwen2.5-14b-lora-garden-eden
num_train_epochs: 3
per_device_train_batch_size: 4
gradient_accumulation_steps: 4
learning_rate: 2e-4
lr_scheduler_type: cosine
warmup_ratio: 0.03
fp16: true
logging_steps: 10
save_steps: 500

### Evaluation
val_size: 0.1
per_device_eval_batch_size: 4
eval_strategy: steps
eval_steps: 500
```

Then run:

```bash
cd LLaMA-Factory
python src/train_bash.py \
  --stage sft \
  --model_name_or_path Qwen/Qwen2.5-14B-Instruct \
  --dataset alpaca_data \
  --dataset_dir ./data \
  --template qwen \
  --finetuning_type lora \
  --lora_rank 16 \
  --lora_alpha 32 \
  --output_dir ./saves/qwen2.5-14b-lora-garden-eden \
  --num_train_epochs 3 \
  --per_device_train_batch_size 4 \
  --learning_rate 2e-4 \
  --fp16
```

### Using Axolotl (Alternative)

```bash
# Install Axolotl
pip install axolotl

# Create config file (axolotl_config.yml)
axolotl train axolotl_config.yml
```

### Using UnSloth (Fastest, Apple Silicon compatible)

```bash
pip install unsloth

# See UnSloth documentation for Qwen 2.5 examples
```

---

## Step 3: Register Adapter

After training completes, register the adapter with Garden of Eden V3:

```rust
use garden_of_eden_v3::services::lora_adapter_manager::LoRAAdapterManager;

let manager = LoRAAdapterManager::new(db)?;

// Register the trained adapter
let adapter = manager.register_adapter(
    "Garden Eden V3 - Personalized".to_string(),
    "Fine-tuned on 1000 high-quality conversations".to_string(),
    "qwen2.5:14b".to_string(),
    "/path/to/LLaMA-Factory/saves/qwen2.5-14b-lora-garden-eden/adapter_model.bin".to_string(),
    "1.0.0".to_string(),
    Some(metadata.id.clone()), // Link to training dataset
)?;

println!("Registered adapter: {} (ID: {})", adapter.name, adapter.id);
```

### Via CLI (Future Enhancement)

```bash
garden-eden register-adapter \
  --name "Garden Eden V3 - Personalized" \
  --base-model "qwen2.5:14b" \
  --adapter-path ./saves/qwen2.5-14b-lora-garden-eden/adapter_model.bin \
  --version "1.0.0"
```

---

## Step 4: Load Adapter in Ollama

### Generate Modelfile

```rust
// Generate Modelfile for the adapter
let modelfile_path = manager.save_modelfile(
    &adapter.id,
    Some("Your name is Adam. You are a personalized AI assistant.".to_string())
)?;

println!("Modelfile saved to: {:?}", modelfile_path);
```

This creates a file like:

```dockerfile
FROM qwen2.5:14b

ADAPTER /path/to/adapter_model.bin

PARAMETER temperature 0.8
PARAMETER top_p 0.92
PARAMETER top_k 45
PARAMETER repeat_penalty 1.15

SYSTEM """
Your name is Adam. You are a personalized AI assistant.
"""
```

### Create Ollama Model

```bash
# Create a new Ollama model with the LoRA adapter
ollama create garden-eden-personalized \
  -f ~/Library/Application\ Support/garden-of-eden-v3/lora_adapters/Garden_Eden_V3_-_Personalized_Modelfile

# Test the model
ollama run garden-eden-personalized "Hello, how are you?"
```

### Set as Active Adapter

```rust
// Set the adapter as active for Garden of Eden V3
manager.set_active_adapter(&adapter.id)?;

println!("Activated adapter: {}", adapter.name);
```

---

## Step 5: Monitor Performance

### Track Satisfaction Metrics

After using the adapter, update performance metrics:

```rust
use garden_of_eden_v3::services::lora_adapter_manager::PerformanceMetrics;

let metrics = PerformanceMetrics {
    avg_satisfaction: 0.88,          // Average user satisfaction
    total_conversations: 250,        // Conversations with this adapter
    training_loss: Some(0.45),       // Final training loss (optional)
    eval_loss: Some(0.52),           // Evaluation loss (optional)
    perplexity: Some(12.5),          // Model perplexity (optional)
};

manager.update_performance_metrics(&adapter.id, metrics)?;
```

### Compare Adapters

```rust
// Compare two adapters to see which performs better
let comparison = manager.compare_adapters(&adapter_v1_id, &adapter_v2_id)?;

println!("Satisfaction diff: {:?}", comparison.satisfaction_diff);
println!("Conversation count diff: {:?}", comparison.conversation_count_diff);

if let Some(diff) = comparison.satisfaction_diff {
    if diff > 0.0 {
        println!("Adapter V1 is better by {:.2} points", diff);
    } else {
        println!("Adapter V2 is better by {:.2} points", -diff);
    }
}
```

---

## Troubleshooting

### Issue: "Out of memory" during training

**Solution**: Reduce batch size or use gradient accumulation

```yaml
per_device_train_batch_size: 2    # Reduce from 4 to 2
gradient_accumulation_steps: 8    # Increase from 4 to 8
```

### Issue: "Adapter not loading in Ollama"

**Solution**: Check adapter path and Modelfile format

```bash
# Verify adapter file exists
ls -lh /path/to/adapter_model.bin

# Check Modelfile syntax
cat ~/Library/Application\ Support/garden-of-eden-v3/lora_adapters/your_adapter_Modelfile

# Recreate Ollama model
ollama rm garden-eden-personalized
ollama create garden-eden-personalized -f ./Modelfile
```

### Issue: "Model responses are too generic"

**Solution**: Increase LoRA rank or train for more epochs

```yaml
lora_rank: 32          # Increase from 16 to 32
num_train_epochs: 5    # Increase from 3 to 5
```

### Issue: "Model is overfitting"

**Solution**: Increase dropout or reduce epochs

```yaml
lora_dropout: 0.1      # Increase from 0.05 to 0.1
num_train_epochs: 2    # Reduce from 3 to 2
```

---

## Advanced Topics

### Multi-Adapter Management

Switch between different adapters for different tasks:

```rust
// Register multiple adapters
let formal_adapter = manager.register_adapter(
    "Formal Business Communication".to_string(),
    "Trained on professional emails".to_string(),
    "qwen2.5:14b".to_string(),
    "/path/to/formal_adapter.bin".to_string(),
    "1.0.0".to_string(),
    None,
)?;

let casual_adapter = manager.register_adapter(
    "Casual Friend Communication".to_string(),
    "Trained on friendly chats".to_string(),
    "qwen2.5:14b".to_string(),
    "/path/to/casual_adapter.bin".to_string(),
    "1.0.0".to_string(),
    None,
)?;

// Switch between adapters based on context
manager.set_active_adapter(&formal_adapter.id)?;
// Use formal adapter for business conversations

manager.set_active_adapter(&casual_adapter.id)?;
// Use casual adapter for friendly chats
```

### Continual Learning

Update adapters incrementally as you collect more data:

1. Export new training data (last 30 days)
2. Merge with previous training data
3. Train new adapter version (v1.1.0)
4. Compare performance with v1.0.0
5. Activate better-performing version

```bash
# Export new data
garden-eden export-training-data \
  --format alpaca \
  --output ./new_data.json \
  --since "2025-01-01" \
  --limit 500

# Merge with previous data
cat training_data.json new_data.json > merged_data.json

# Train new version
cd LLaMA-Factory
python src/train_bash.py \
  --dataset merged_data \
  --output_dir ./saves/qwen2.5-14b-lora-garden-eden-v1.1 \
  ...

# Register and compare
garden-eden register-adapter \
  --name "Garden Eden V3 - Personalized" \
  --version "1.1.0" \
  --adapter-path ./saves/qwen2.5-14b-lora-garden-eden-v1.1/adapter_model.bin

garden-eden compare-adapters v1.0.0 v1.1.0
```

### A/B Testing

Test multiple adapters simultaneously:

1. Split users into groups
2. Assign different adapters to each group
3. Collect satisfaction metrics
4. Analyze results to find best adapter

```rust
// Example: A/B test two adapters over 100 conversations each
let adapter_a_id = "...";
let adapter_b_id = "...";

// Group A uses adapter A for 100 conversations
manager.set_active_adapter(&adapter_a_id)?;
// ... collect conversations and satisfaction ...

// Group B uses adapter B for 100 conversations
manager.set_active_adapter(&adapter_b_id)?;
// ... collect conversations and satisfaction ...

// Compare results
let comparison = manager.compare_adapters(&adapter_a_id, &adapter_b_id)?;
println!("Winner: {}", if comparison.satisfaction_diff.unwrap() > 0.0 {
    "Adapter A"
} else {
    "Adapter B"
});
```

---

## Best Practices

1. **Start small**: Train on 500-1000 high-quality conversations first
2. **Filter aggressively**: Use satisfaction >= 0.8 for best results
3. **Version control**: Keep multiple adapter versions for rollback
4. **Monitor metrics**: Track satisfaction after each adapter update
5. **Iterate**: Continuously collect data and retrain every 1-2 months
6. **Test before deployment**: Always test new adapters on sample conversations
7. **Document changes**: Keep notes on what each adapter version improves

---

## Resources

- [LLaMA-Factory GitHub](https://github.com/hiyouga/LLaMA-Factory)
- [Ollama Modelfile Documentation](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)
- [LoRA Paper (2021)](https://arxiv.org/abs/2106.09685)
- [Qwen 2.5 Documentation](https://github.com/QwenLM/Qwen)
- [Garden of Eden V3 Discord](https://discord.gg/garden-eden-v3) (Future)

---

## FAQ

**Q: How much data do I need to fine-tune?**

A: Minimum 200-500 examples, recommended 1000-5000 for best results.

**Q: How long does training take?**

A: 1-3 hours for 1000 examples on a modern GPU (RTX 3090/4090).

**Q: Can I train on CPU?**

A: Yes, but it will be 10-50x slower. Use GPU or Apple Silicon (Metal).

**Q: Will fine-tuning break the base model?**

A: No! LoRA adapters are separate and can be removed at any time.

**Q: How much VRAM do I need?**

A: Minimum 8GB for batch size 1-2, recommended 16GB for batch size 4-8.

**Q: Can I share my adapter with others?**

A: Yes, but be careful about privacy. Only share adapters trained on non-sensitive data.

**Q: How often should I retrain?**

A: Every 1-2 months, or whenever you collect 500+ new high-quality conversations.

---

**Happy fine-tuning! 🚀**

For support, open an issue on [GitHub](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues).
