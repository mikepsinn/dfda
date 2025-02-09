import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Get Docker image information from environment variables or use default values
const imageName = process.env.DOCKER_IMAGE_NAME || 'curedao/dfda-web';
const imageTag = process.env.DOCKER_IMAGE_TAG || '1.0.0';
const fullImageName = `${imageName}:${imageTag}`;

function buildContainer() {
  console.log(`Building Docker image ${fullImageName}...`);
  try {
    execSync(`docker build -t ${fullImageName} .`, { stdio: 'inherit' });
    console.log('Docker image built successfully.');
  } catch (error) {
    console.error('Docker build failed:', error);
    process.exit(1);
  }
}

function pushContainer() {
  // Tag the image as latest
  const latestTag = `${imageName}:latest`;
  console.log(`Tagging Docker image as ${latestTag}...`);
  try {
    execSync(`docker tag ${fullImageName} ${latestTag}`, { stdio: 'inherit' });
    console.log('Docker image tagged as latest successfully.');
  } catch (error) {
    console.error('Docker tag failed:', error);
    process.exit(1);
  }

  // Push all tags (both the version-specific and latest) at once
  console.log(`Pushing all tags for ${imageName}...`);
  try {
    execSync(`docker push --all-tags ${imageName}`, { stdio: 'inherit' });
    console.log('All Docker tags pushed successfully.');
  } catch (error) {
    console.error('Docker push for all tags failed:', error);
    process.exit(1);
  }
}

async function main() {
  buildContainer();
  pushContainer();
}

main(); 