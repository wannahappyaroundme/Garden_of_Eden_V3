#!/bin/bash
# LLM Benchmark Script - Measure actual response latency
# Tests multiple models with the same prompt to compare performance

set -e

MODELS=(
  "qwen2.5:14b"
  "qwen2.5:32b"
  "llama3.1:8b"
)

# Test prompt (Korean + English for realistic testing)
PROMPT="안녕하세요! 간단한 파이썬 함수를 작성해주세요. 1부터 10까지의 숫자를 더하는 함수입니다."

echo "================================================"
echo "🚀 LLM Performance Benchmark"
echo "================================================"
echo ""
echo "Testing prompt:"
echo "\"$PROMPT\""
echo ""
echo "================================================"
echo ""

for MODEL in "${MODELS[@]}"; do
  echo "Testing: $MODEL"
  echo "----------------------------------------"

  # Check if model exists
  if ! ollama list | grep -q "$MODEL"; then
    echo "⚠️  Model not found: $MODEL (skipping)"
    echo ""
    continue
  fi

  # Measure time for response
  START_TIME=$(date +%s.%N)

  # Run inference (capture first 50 tokens for fair comparison)
  RESPONSE=$(ollama run "$MODEL" "$PROMPT" --verbose 2>&1 | head -c 500)

  END_TIME=$(date +%s.%N)

  # Calculate latency
  LATENCY=$(echo "$END_TIME - $START_TIME" | bc)

  echo "⏱️  Total time: ${LATENCY}s"
  echo ""
  echo "Response preview:"
  echo "$RESPONSE" | head -n 5
  echo "..."
  echo ""
  echo "================================================"
  echo ""
done

echo ""
echo "✅ Benchmark completed!"
echo ""
echo "📊 Recommendation:"
echo "   - For fastest response: Use the model with lowest latency"
echo "   - For Korean support: qwen2.5 models are recommended"
echo "   - For balance: qwen2.5:14b offers good speed + quality"
