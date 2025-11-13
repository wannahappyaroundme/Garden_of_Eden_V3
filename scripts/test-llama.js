#!/usr/bin/env node
/**
 * Test Script for Llama 3.1 8B Integration
 * Tests basic model loading and inference capabilities
 */

const path = require('path');
const fs = require('fs');

async function testLlamaIntegration() {
  console.log('=== Llama 3.1 8B Integration Test ===\n');

  // Check model file
  const modelPath = path.join(
    process.env.HOME || process.env.USERPROFILE || '.',
    '.garden-of-eden-v3',
    'models',
    'llama-3.1-8b-instruct-q4_k_m.gguf'
  );

  console.log(`1. Checking model file at: ${modelPath}`);

  if (!fs.existsSync(modelPath)) {
    console.error('❌ Model file not found!');
    console.error('Please download the model first using: npm run download:llama');
    process.exit(1);
  }

  const stats = fs.statSync(modelPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Model file found (${sizeMB} MB)\n`);

  // Check node-llama-cpp installation
  console.log('2. Checking node-llama-cpp installation...');
  try {
    require.resolve('node-llama-cpp');
    console.log('✅ node-llama-cpp is installed\n');
  } catch (err) {
    console.error('❌ node-llama-cpp not found!');
    console.error('Please install it with: npm install node-llama-cpp');
    process.exit(1);
  }

  // Test model loading
  console.log('3. Testing model loading (this may take 10-30 seconds)...');

  try {
    const { getLlama, LlamaChatSession } = await import('node-llama-cpp');

    console.log('   - Getting Llama instance...');
    const llama = await getLlama();

    console.log('   - Loading model...');
    const model = await llama.loadModel({
      modelPath: modelPath,
      gpuLayers: 33, // Offload to Metal (macOS) or CUDA (Windows)
    });

    console.log('✅ Model loaded successfully\n');

    // Test context creation
    console.log('4. Creating context (4096 tokens)...');
    const context = await model.createContext({
      contextSize: 4096,
    });
    console.log('✅ Context created successfully\n');

    // Test chat session
    console.log('5. Creating chat session...');
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
    });
    console.log('✅ Chat session created successfully\n');

    // Test inference
    console.log('6. Testing inference with a simple prompt...');
    console.log('   Prompt: "What is 2+2? Answer in one sentence."\n');

    const startTime = Date.now();
    let tokenCount = 0;

    const response = await session.prompt(
      'What is 2+2? Answer in one sentence.',
      {
        temperature: 0.7,
        maxTokens: 100,
        onTextChunk: (chunk) => {
          process.stdout.write(chunk);
          tokenCount++;
        },
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const tokensPerSec = (tokenCount / duration).toFixed(2);

    console.log(`\n\n✅ Inference successful!`);
    console.log(`   Response length: ${response.length} characters`);
    console.log(`   Time taken: ${duration}s`);
    console.log(`   Speed: ${tokensPerSec} tokens/sec\n`);

    // Cleanup
    console.log('7. Cleaning up resources...');
    context.dispose();
    model.dispose();
    console.log('✅ Cleanup complete\n');

    console.log('=================================');
    console.log('🎉 All tests passed successfully!');
    console.log('=================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run test
testLlamaIntegration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
