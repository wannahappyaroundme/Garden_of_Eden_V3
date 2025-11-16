#!/usr/bin/env node
/**
 * LLM Performance Benchmark
 * Measures actual token generation speed (tokens/second) for different models
 */

const { spawn } = require('child_process');

const MODELS = [
  'llama3.1:8b',
  'qwen2.5:14b',
  'qwen2.5:32b',
];

// Test prompt (mix of Korean and English for realistic testing)
const PROMPT = '안녕하세요! Write a simple Python function that adds numbers from 1 to 10. Explain the code briefly.';

async function benchmarkModel(model) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${model}`);
  console.log('='.repeat(60));

  return new Promise((resolve) => {
    const startTime = Date.now();
    let firstTokenTime = null;
    let tokenCount = 0;
    let responseText = '';

    const ollama = spawn('/usr/local/bin/ollama', ['run', model, PROMPT]);

    ollama.stdout.on('data', (data) => {
      const text = data.toString();
      responseText += text;

      // Track first token time (time to first response)
      if (!firstTokenTime) {
        firstTokenTime = Date.now();
      }

      // Rough token estimation (words / 0.75 ≈ tokens)
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      tokenCount += Math.ceil(words / 0.75);
    });

    ollama.on('close', () => {
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // seconds
      const timeToFirstToken = firstTokenTime ? (firstTokenTime - startTime) / 1000 : 0;
      const tokensPerSecond = tokenCount / totalTime;

      console.log(`\n📊 Results:`);
      console.log(`   ⏱️  Total time: ${totalTime.toFixed(2)}s`);
      console.log(`   🚀 Time to first token: ${timeToFirstToken.toFixed(2)}s`);
      console.log(`   📝 Estimated tokens: ~${tokenCount}`);
      console.log(`   ⚡ Speed: ${tokensPerSecond.toFixed(1)} tokens/sec`);
      console.log(`\n💬 Response preview:`);
      console.log(responseText.substring(0, 300) + '...\n');

      resolve({
        model,
        totalTime,
        timeToFirstToken,
        tokenCount,
        tokensPerSecond,
        responseText,
      });
    });

    ollama.stderr.on('data', (data) => {
      // Ignore stderr (progress messages, etc.)
    });
  });
}

async function runBenchmark() {
  console.log('\n🚀 LLM Performance Benchmark');
  console.log('='.repeat(60));
  console.log(`Testing ${MODELS.length} models`);
  console.log(`Prompt: "${PROMPT.substring(0, 80)}..."`);
  console.log('='.repeat(60));

  const results = [];

  for (const model of MODELS) {
    try {
      const result = await benchmarkModel(model);
      results.push(result);
    } catch (err) {
      console.error(`❌ Error testing ${model}:`, err.message);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 BENCHMARK SUMMARY');
  console.log('='.repeat(60));

  // Sort by tokens per second (fastest first)
  results.sort((a, b) => b.tokensPerSecond - a.tokensPerSecond);

  console.log('\n🏆 Ranking (by speed):');
  results.forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    console.log(`\n${medal} ${i + 1}. ${r.model}`);
    console.log(`   Speed: ${r.tokensPerSecond.toFixed(1)} tok/s`);
    console.log(`   Total time: ${r.totalTime.toFixed(2)}s`);
    console.log(`   First token: ${r.timeToFirstToken.toFixed(2)}s`);
  });

  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:');
  console.log('='.repeat(60));

  const fastest = results[0];
  console.log(`\n✅ For fastest response: ${fastest.model}`);
  console.log(`   - ${fastest.tokensPerSecond.toFixed(1)} tokens/second`);
  console.log(`   - Best for quick interactions`);

  const qwenModels = results.filter(r => r.model.includes('qwen'));
  if (qwenModels.length > 0) {
    const bestQwen = qwenModels[0];
    console.log(`\n✅ For Korean + English: ${bestQwen.model}`);
    console.log(`   - ${bestQwen.tokensPerSecond.toFixed(1)} tokens/second`);
    console.log(`   - Excellent Korean language support`);
  }

  const balanced = results.find(r => r.tokensPerSecond > 20 && r.model.includes('14b'));
  if (balanced) {
    console.log(`\n✅ For balanced performance: ${balanced.model}`);
    console.log(`   - ${balanced.tokensPerSecond.toFixed(1)} tokens/second`);
    console.log(`   - Good balance of speed and quality`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Benchmark completed!\n');
}

runBenchmark().catch(console.error);
