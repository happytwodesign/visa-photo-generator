import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODEL_DIR = path.join(path.dirname(__dirname), 'public', 'models');

const MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

async function downloadFile(url: string, outputPath: string) {
  console.log(`Downloading from ${url}`);
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    });
    fs.writeFileSync(outputPath, response.data);
    console.log(`Successfully downloaded and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    throw error;
  }
}

async function downloadModels() {
  console.log(`Creating directory: ${MODEL_DIR}`);
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  for (const model of MODELS) {
    const url = `${MODEL_URL}/${model}`;
    const outputPath = path.join(MODEL_DIR, model);
    console.log(`Downloading ${model}...`);
    await downloadFile(url, outputPath);
  }

  console.log('All models downloaded successfully!');
}

console.log('Starting model download...');
downloadModels().catch(error => {
  console.error('An error occurred during model download:', error);
  process.exit(1);
});