# Qwen 2.5 32B Fine-tuning Guide

## Overview

This guide covers fine-tuning Qwen 2.5 32B Instruct for Garden of Eden V3. The 32B model was chosen specifically for its stability during continual learning - it can handle regular fine-tuning without catastrophic forgetting that plagues smaller models.

---

## Why Qwen 2.5 32B for Fine-tuning?

### Advantages over 14B/8B Models

| Factor | 8B Model | 14B Model | **32B Model** | Winner |
|--------|----------|-----------|---------------|---------|
| Overfitting Risk | **10x higher** | High | Low | **32B** |
| Learning Rate | 1e-5 max | 1e-5 ~ 2e-5 | **2e-5 ~ 5e-5** | **32B** |
| Data Requirements | 1-5k samples | 5-10k samples | **10-30k samples** | **32B** |
| Epochs | 1-3 max | 3-5 | **5-10** | **32B** |
| Catastrophic Forgetting | **Critical risk** | Medium risk | **Low risk** | **32B** |
| LoRA Rank | r=8-16 | r=16-32 | **r=32-64** | **32B** |
| Generalization | Poor | Good | **Excellent** | **32B** |

**Key Insight**: The 32B model's larger parameter space allows it to learn new patterns (your conversation style, Korean preferences) without destroying existing knowledge (coding, reasoning, general facts).

---

## Recommended Training Recipe

### QLoRA 4-bit Fine-tuning (Memory Efficient)

For M3 MAX 36GB, we use **QLoRA** (Quantized LoRA) to fit 32B fine-tuning in memory.

#### Hyperparameters

```python
# Training configuration for Qwen 2.5 32B on M3 MAX
config = {
    # Model
    "model_name": "Qwen/Qwen2.5-32B-Instruct",
    "load_in_4bit": True,  # QLoRA 4-bit quantization

    # LoRA settings
    "lora_r": 64,  # Rank (32-64 range safe for 32B)
    "lora_alpha": 128,  # Alpha = 2 * rank (scaling factor)
    "lora_dropout": 0.05,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],

    # Training hyperparameters
    "learning_rate": 2e-5,  # 32B can handle higher LR than 14B
    "max_lr": 5e-5,  # Peak LR for warmup (optional)
    "num_epochs": 5,  # 5-10 epochs safe for 32B
    "batch_size": 4,  # Per device (use gradient accumulation)
    "gradient_accumulation_steps": 8,  # Effective batch = 4 * 8 = 32
    "warmup_steps": 100,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,

    # Optimizer
    "optimizer": "paged_adamw_8bit",  # Memory-efficient optimizer
    "lr_scheduler_type": "cosine",

    # Early stopping
    "early_stopping_patience": 3,
    "evaluation_strategy": "steps",
    "eval_steps": 50,
    "save_steps": 100,

    # Memory optimization
    "gradient_checkpointing": True,
    "fp16": False,  # Use bf16 on M3 MAX
    "bf16": True,
}
```

#### Memory Usage

- **Base model (4-bit)**: ~20GB
- **LoRA adapters**: ~2-3GB
- **Gradients + optimizer**: ~8-10GB
- **Total**: ~30-33GB (fits in 36GB M3 MAX) ✅

---

## Data Preparation

### Data Quantity

| Training Round | Samples | Epochs | Total Conversations |
|----------------|---------|--------|---------------------|
| **Initial** | 1,000 | 3 | 3,000 |
| **Round 2** (1 month) | 3,000 | 5 | 15,000 |
| **Round 3** (3 months) | 5,000 | 5 | 25,000 |
| **Maintenance** | 1,000 / month | 3 | 3,000 / month |

### Data Format

Qwen 2.5 uses ChatML format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "당신은 Garden of Eden의 AI 어시스턴트 Eden입니다. 친근하고 도움이 되는 한국어 대화를 제공합니다."
    },
    {
      "role": "user",
      "content": "오늘 날씨 어때?"
    },
    {
      "role": "assistant",
      "content": "날씨 정보를 확인해드릴게요. 현재 서울은 맑고 기온이 18도입니다."
    }
  ]
}
```

### Data Sources

1. **User conversations** (Garden of Eden app)
   - Export from SQLite database
   - Filter by satisfaction score (>3/5 only)
   - Anonymize personal information

2. **Synthetic data** (from `synthetic-data.service.ts`)
   - Generate variations of successful conversations
   - Paraphrase user queries (5 variations each)
   - Create negative samples for contrastive learning

3. **Korean conversation datasets** (optional)
   - Korean Social Conversations (공개 데이터셋)
   - AI Hub Korean dialogue corpus
   - Mix with user data at 20-30% ratio

### Data Quality Checklist

- [ ] All conversations have Korean content
- [ ] Language mixing <1% (filter out mixed responses)
- [ ] No personal information (emails, phone numbers, addresses)
- [ ] Balanced topics (casual, coding, reasoning, creative)
- [ ] User satisfaction score ≥3/5
- [ ] Response length 50-300 tokens (not too short, not too long)

---

## Training Process

### Step 1: Setup Environment

```bash
# Install dependencies
pip install torch transformers datasets peft bitsandbytes accelerate
pip install trl  # Transformer Reinforcement Learning

# For M3 MAX (Metal acceleration)
pip install mlx mlx-lm  # Apple MLX framework
```

### Step 2: Prepare Dataset

```python
from datasets import load_dataset

# Load your conversation data
dataset = load_dataset('json', data_files='eden_conversations.jsonl')

# Split train/validation (90/10)
dataset = dataset['train'].train_test_split(test_size=0.1)

print(f"Train samples: {len(dataset['train'])}")
print(f"Validation samples: {len(dataset['test'])}")
```

### Step 3: Load Model with QLoRA

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# Load model
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-32B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# Prepare for k-bit training
model = prepare_model_for_kbit_training(model)

# LoRA config
lora_config = LoraConfig(
    r=64,
    lora_alpha=128,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

# Add LoRA adapters
model = get_peft_model(model, lora_config)

print(f"Trainable parameters: {model.print_trainable_parameters()}")
# Expected: ~1-2% of total parameters (320M / 32B = 1%)
```

### Step 4: Train

```python
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir="./qwen2.5-32b-eden-v1",
    num_train_epochs=5,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    gradient_checkpointing=True,
    learning_rate=2e-5,
    bf16=True,
    logging_steps=10,
    save_strategy="steps",
    save_steps=100,
    evaluation_strategy="steps",
    eval_steps=50,
    warmup_steps=100,
    lr_scheduler_type="cosine",
    report_to="tensorboard",
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset['train'],
    eval_dataset=dataset['test'],
    tokenizer=tokenizer,
)

# Start training
trainer.train()

# Save LoRA adapters
trainer.save_model("./qwen2.5-32b-eden-final")
```

### Step 5: Merge and Export

```python
from peft import PeftModel

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-32B-Instruct",
    torch_dtype=torch.bfloat16,
    device_map="auto",
)

# Load LoRA adapters
model = PeftModel.from_pretrained(base_model, "./qwen2.5-32b-eden-final")

# Merge LoRA weights into base model
model = model.merge_and_unload()

# Save merged model
model.save_pretrained("./qwen2.5-32b-eden-merged")

# Quantize to GGUF Q4_K_M for deployment
# (Use llama.cpp's convert.py and quantize tools)
```

---

## Catastrophic Forgetting Prevention

### Strategy 1: Mixed Training Data

Don't fine-tune on ONLY user conversations. Mix in general data to preserve original capabilities:

```python
# Training data composition
user_conversations = 0.70  # 70% user-specific
general_korean = 0.15      # 15% general Korean dialogue
coding_examples = 0.10     # 10% coding tasks (to preserve HumanEval)
reasoning_tasks = 0.05     # 5% math/reasoning (to preserve MATH benchmark)
```

### Strategy 2: Monitor Benchmark Scores

Track key metrics after each fine-tuning round:

| Benchmark | Before FT | After Round 1 | After Round 2 | Alert Threshold |
|-----------|-----------|---------------|---------------|-----------------|
| **KMMLU** | 70.5 | 71.2 ✅ | 71.8 ✅ | <69 (drop >2pts) |
| **MMLU** | 83.3 | 82.9 ✅ | 82.5 ✅ | <81 (drop >2pts) |
| **HumanEval** | 58.5 | 57.8 ✅ | 56.2 ⚠️ | <55 (drop >3pts) |
| **MATH** | 57.7 | 57.1 ✅ | 56.5 ✅ | <55 (drop >2pts) |

**Action**: If any metric drops below threshold, reduce user data ratio and add more general/coding data.

### Strategy 3: Early Stopping

Use validation loss plateauing to stop training before overfitting:

```python
from transformers import EarlyStoppingCallback

# Stop if validation loss doesn't improve for 3 evaluation steps
early_stopping = EarlyStoppingCallback(
    early_stopping_patience=3,
    early_stopping_threshold=0.01,
)

trainer = Trainer(
    # ... other args
    callbacks=[early_stopping],
)
```

---

## Evaluation & Testing

### Automated Tests

```python
# Test Korean language quality
test_prompts = [
    "오늘 날씨 어때?",
    "파이썬으로 피보나치 수열 코드 짜줘",
    "내 기분이 안 좋아",
    "React에서 useState 사용법 알려줘",
]

for prompt in test_prompts:
    response = generate(model, prompt)

    # Check language mixing
    korean_ratio = count_korean_chars(response) / len(response)
    assert korean_ratio > 0.9, f"Too much English mixing: {response}"

    # Check response quality
    assert len(response) > 20, f"Response too short: {response}"
    assert not contains_gibberish(response), f"Gibberish detected: {response}"
```

### Manual Testing Checklist

- [ ] Casual conversation feels natural (친구 같은 대화)
- [ ] Korean language mixing <1%
- [ ] Coding ability preserved (can write Python, TypeScript, React)
- [ ] Math/reasoning ability preserved (can solve logic problems)
- [ ] General knowledge intact (knows capitals, historical facts)
- [ ] Persona consistency (responds in expected tone/style)

---

## Deployment

### Option 1: Merge and Quantize (Recommended)

```bash
# 1. Merge LoRA adapters into base model
python merge_lora.py \
  --base_model Qwen/Qwen2.5-32B-Instruct \
  --lora_adapters ./qwen2.5-32b-eden-final \
  --output ./qwen2.5-32b-eden-merged

# 2. Convert to GGUF format
python llama.cpp/convert.py \
  ./qwen2.5-32b-eden-merged \
  --outfile qwen2.5-32b-eden.gguf

# 3. Quantize to Q4_K_M
./llama.cpp/quantize \
  qwen2.5-32b-eden.gguf \
  qwen2.5-32b-eden-q4_k_m.gguf \
  Q4_K_M

# 4. Replace model in Garden of Eden
cp qwen2.5-32b-eden-q4_k_m.gguf \
   ~/.garden-of-eden-v3/models/qwen2.5-32b-instruct-q4_k_m.gguf
```

### Option 2: Load LoRA Adapters Dynamically (Experimental)

```python
# llama.service.ts modification (future enhancement)
# Load base model + LoRA adapters separately for faster switching

from peft import PeftModel

base_model = load_base_model("qwen2.5-32b-instruct-q4_k_m.gguf")
lora_adapters = load_lora_adapters("./lora_adapters/round_3")

# Apply adapters
model = PeftModel(base_model, lora_adapters)
```

---

## Fine-tuning Schedule

### Initial Training (Week 1)

- Collect 1,000 high-quality user conversations
- Mix with 300 general Korean dialogues
- Train for 3 epochs with learning rate 2e-5
- Evaluate: KMMLU, language mixing rate

### Round 2 (Month 1)

- Collect 3,000 additional conversations
- Add synthetic data (query paraphrasing)
- Train for 5 epochs with learning rate 1.5e-5
- Evaluate: All benchmarks

### Round 3 (Month 3)

- Collect 5,000 conversations
- Fine-tune on specific weak areas (coding, reasoning)
- Train for 5 epochs with learning rate 1e-5
- Final evaluation + deployment

### Maintenance (Monthly)

- Collect 1,000 new conversations
- Light fine-tuning: 1-2 epochs, learning rate 5e-6
- Monitor for drift and catastrophic forgetting

---

## Troubleshooting

### Problem 1: Model Responses in English

**Symptoms**: Model answers Korean questions in English

**Solution**:
1. Increase Korean data ratio to 80-90%
2. Add system prompt emphasizing Korean: "모든 답변은 한국어로만 작성하세요"
3. Filter training data: remove conversations with >5% English

### Problem 2: Catastrophic Forgetting (Coding Ability Lost)

**Symptoms**: HumanEval score drops from 58.5 to <50

**Solution**:
1. Add 20% coding examples to training data
2. Reduce epochs from 5 to 3
3. Lower learning rate from 2e-5 to 1e-5
4. Use replay buffer: mix 30% old successful conversations

### Problem 3: Overfitting (Low Validation Accuracy)

**Symptoms**: Training loss decreases but validation loss increases

**Solution**:
1. Enable early stopping (patience=3)
2. Increase LoRA dropout from 0.05 to 0.1
3. Reduce epochs
4. Add more diverse training data

### Problem 4: Out of Memory (OOM)

**Symptoms**: Training crashes with CUDA/Metal OOM error

**Solution**:
1. Reduce batch size from 4 to 2
2. Increase gradient accumulation from 8 to 16
3. Enable gradient checkpointing
4. Use 4-bit quantization (QLoRA)
5. Reduce LoRA rank from 64 to 32

---

## Advanced Techniques

### RAFT Integration

Fine-tune with retrieval-augmented data to improve grounding:

```python
# Training data with context
{
  "messages": [
    {
      "role": "system",
      "content": "Based on the following context, answer the question accurately.\n\nContext: [Retrieved conversation history]"
    },
    {
      "role": "user",
      "content": "User query"
    },
    {
      "role": "assistant",
      "content": "Grounded response based on context"
    }
  ]
}
```

### DPO (Direct Preference Optimization)

Use user satisfaction scores (thumbs up/down) for preference-based fine-tuning:

```python
# DPO training data
{
  "prompt": "오늘 날씨 어때?",
  "chosen": "서울은 현재 맑고 기온이 18도입니다. 외출하기 좋은 날씨예요! 😊",  # 👍 rated response
  "rejected": "I don't know the weather information.",  # 👎 rated response
}
```

### Continual Pre-training

For advanced users: continue pre-training on Korean corpus before fine-tuning:

```bash
# Step 1: Continual pre-training on Korean text (1-2 epochs)
python pretrain.py \
  --model Qwen/Qwen2.5-32B \
  --data korean_corpus.txt \
  --epochs 1 \
  --lr 1e-5

# Step 2: Instruction fine-tuning on conversations
python finetune.py \
  --model ./qwen2.5-32b-korean-pretrained \
  --data eden_conversations.jsonl
```

---

## Resources

- **Qwen 2.5 Official Docs**: https://qwenlm.github.io/
- **QLoRA Paper**: https://arxiv.org/abs/2305.14314
- **PEFT Library**: https://github.com/huggingface/peft
- **llama.cpp GGUF Conversion**: https://github.com/ggerganov/llama.cpp
- **KMMLU Benchmark**: https://github.com/HAERAE-HUB/KMMLU

---

## License

Fine-tuned models based on Qwen 2.5 inherit the Apache 2.0 license. You can freely use, modify, and distribute fine-tuned weights.

---

**Last Updated**: 2025-01-14
**Model Version**: Qwen 2.5 32B Instruct
**Target Hardware**: M3 MAX 36GB RAM
