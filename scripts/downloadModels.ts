import axios from 'axios';
import fs from 'fs';
import path from 'path';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODEL_DIR = path.join(process.cwd(), 'public', 'models');

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
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer',
  });

  fs.writeFileSync(outputPath, response.data);
}

async function downloadModels() {
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

downloadModels().catch(console.error);