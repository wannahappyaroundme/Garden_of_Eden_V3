/**
 * AI Model Download Script
 * Downloads Llama 3.1 8B, Whisper Large V3, and LLaVA 7B models
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Model URLs from HuggingFace
const MODELS = {
  llama: {
    name: 'Llama 3.1 8B (Q4_K_M)',
    url: 'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
    filename: 'llama-3.1-8b-instruct-q4.gguf',
    size: '4.8 GB',
  },
  whisper: {
    name: 'Whisper Large V3',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    filename: 'whisper-large-v3.bin',
    size: '3.1 GB',
  },
  llava: {
    name: 'LLaVA 7B (Q4_K)',
    url: 'https://huggingface.co/mys/ggml_llava-v1.5-7b/resolve/main/ggml-model-q4_k.gguf',
    filename: 'llava-7b-q4.gguf',
    size: '4.0 GB',
  },
};

const MODELS_DIR = path.join(__dirname, '..', 'resources', 'models');

/**
 * Ensure models directory exists
 */
function ensureModelsDir() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`✅ Created directory: ${MODELS_DIR}`);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download a file with progress
 */
function downloadFile(url, dest, modelName) {
  return new Promise((resolve, reject) => {
    console.log(`\n📥 Downloading ${modelName}...`);
    console.log(`   URL: ${url}`);
    console.log(`   Destination: ${dest}`);

    const file = fs.createWriteStream(dest);
    let downloaded = 0;
    let totalSize = 0;

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`   Following redirect: ${redirectUrl}`);
        return downloadFile(redirectUrl, dest, modelName).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      totalSize = parseInt(response.headers['content-length'], 10);
      console.log(`   Total size: ${formatBytes(totalSize)}`);

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        const downloadedMB = formatBytes(downloaded);
        const totalMB = formatBytes(totalSize);

        // Update progress on same line
        process.stdout.write(
          `\r   Progress: ${percent}% (${downloadedMB} / ${totalMB})`
        );
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`\n✅ Downloaded ${modelName}`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

/**
 * Check if model already exists
 */
function modelExists(filename) {
  const filepath = path.join(MODELS_DIR, filename);
  return fs.existsSync(filepath);
}

/**
 * Download a specific model
 */
async function downloadModel(modelKey) {
  const model = MODELS[modelKey];
  if (!model) {
    console.error(`❌ Unknown model: ${modelKey}`);
    console.log(`   Available models: ${Object.keys(MODELS).join(', ')}`);
    return false;
  }

  const dest = path.join(MODELS_DIR, model.filename);

  if (modelExists(model.filename)) {
    console.log(`⏭️  ${model.name} already exists, skipping...`);
    return true;
  }

  try {
    await downloadFile(model.url, dest, model.name);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${model.name}:`, error.message);
    return false;
  }
}

/**
 * Download all models
 */
async function downloadAllModels() {
  console.log('🌟 Garden of Eden V3 - AI Model Downloader');
  console.log('='.repeat(60));
  console.log(`📁 Models directory: ${MODELS_DIR}`);
  console.log(`📦 Total download size: ~12 GB`);
  console.log('='.repeat(60));

  ensureModelsDir();

  const results = {
    llama: await downloadModel('llama'),
    whisper: await downloadModel('whisper'),
    llava: await downloadModel('llava'),
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Download Summary:');
  console.log(`   Llama 3.1 8B: ${results.llama ? '✅' : '❌'}`);
  console.log(`   Whisper Large V3: ${results.whisper ? '✅' : '❌'}`);
  console.log(`   LLaVA 7B: ${results.llava ? '✅' : '❌'}`);
  console.log('='.repeat(60));

  const allSuccess = Object.values(results).every(Boolean);
  if (allSuccess) {
    console.log('\n🎉 All models downloaded successfully!');
    console.log('   You can now run the application with AI capabilities.');
  } else {
    console.log('\n⚠️  Some models failed to download.');
    console.log('   The application will still work, but AI features may be limited.');
  }

  return allSuccess;
}

/**
 * Create README in models directory
 */
function createModelsReadme() {
  const readmePath = path.join(MODELS_DIR, 'README.md');
  const content = `# AI Models

This directory contains the AI models for Garden of Eden V3.

## Models

### Llama 3.1 8B (Q4_K_M)
- **Purpose**: Conversation generation, reasoning, code assistance
- **Size**: ~4.8 GB
- **Format**: GGUF (quantized to Q4_K_M for faster inference)
- **File**: llama-3.1-8b-instruct-q4.gguf

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

\`\`\`bash
npm run download:models
\`\`\`

Or download individual models:

\`\`\`bash
npm run download:llama
npm run download:whisper
npm run download:llava
\`\`\`

## Total Size

~12 GB of disk space required.

## Model Sources

All models are from Hugging Face:
- Llama 3.1: Meta-Llama-3.1-8B-Instruct (quantized by bartowski)
- Whisper: OpenAI Whisper Large V3 (GGML format by ggerganov)
- LLaVA: LLaVA 1.5 7B (GGML format by mys)

## License

Each model has its own license. Please refer to the original model repositories.
`;

  fs.writeFileSync(readmePath, content);
  console.log(`✅ Created ${readmePath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const modelFlag = args.find(arg => arg.startsWith('--model='));

  ensureModelsDir();
  createModelsReadme();

  if (modelFlag) {
    // Download specific model
    const modelKey = modelFlag.split('=')[1];
    const success = await downloadModel(modelKey);
    process.exit(success ? 0 : 1);
  } else {
    // Download all models
    const success = await downloadAllModels();
    process.exit(success ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { downloadModel, downloadAllModels };
