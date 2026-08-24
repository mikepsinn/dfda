const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const glob = require('glob');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET: process.env.AWS_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_DIRECTORY: process.env.AWS_S3_DIRECTORY || 'images',
  AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL // Optional, for using CloudFront URLs
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value && key !== 'AWS_CLOUDFRONT_URL')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configure AWS client
const s3Client = new S3Client({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY,
  }
});

const bucketName = requiredEnvVars.AWS_BUCKET;
const s3Directory = requiredEnvVars.AWS_S3_DIRECTORY;

// Check if file exists in S3
async function checkFileExists(fileKey) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// Upload file to S3
async function uploadFile(filePath, fileKey) {
  try {
    const exists = await checkFileExists(fileKey);
    if (exists) {
      console.log(`File ${fileKey} already exists in S3, skipping...`);
      return getFileUrl(fileKey);
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);
    
    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: fileStream,
      ContentType: contentType,
      ACL: 'public-read', // Make the file publicly accessible
    };

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await parallelUploads3.done();
    console.log(`Successfully uploaded ${fileKey}`);
    return getFileUrl(fileKey);
  } catch (err) {
    console.error(`Error uploading ${fileKey}:`, err);
    return null;
  }
}

// Get the URL for an uploaded file
function getFileUrl(fileKey) {
  if (requiredEnvVars.AWS_CLOUDFRONT_URL) {
    return `${requiredEnvVars.AWS_CLOUDFRONT_URL}/${fileKey}`;
  }
  return `https://${bucketName}.s3.${requiredEnvVars.AWS_REGION}.amazonaws.com/${fileKey}`;
}

// Extract image paths from markdown content
function extractImagePaths(content) {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const imagePath = match[1].split('?')[0]; // Remove query parameters if any
    if (!imagePath.startsWith('http')) {
      images.push({
        fullMatch: match[0],
        path: imagePath
      });
    }
  }

  return images;
}

// Process a single markdown file
async function processMarkdownFile(mdFilePath) {
  console.log(`Processing markdown file: ${mdFilePath}`);
  let content = fs.readFileSync(mdFilePath, 'utf8');
  const images = extractImagePaths(content);
  
  for (const image of images) {
    const absoluteImagePath = path.resolve(path.dirname(mdFilePath), image.path);
    
    if (!fs.existsSync(absoluteImagePath)) {
      console.warn(`Image not found: ${absoluteImagePath}`);
      continue;
    }

    const fileExt = path.extname(absoluteImagePath);
    const fileName = path.basename(absoluteImagePath);
    const s3Key = `${s3Directory}/${fileName}`;
    
    const s3Url = await uploadFile(absoluteImagePath, s3Key);
    if (s3Url) {
      content = content.replace(image.fullMatch, image.fullMatch.replace(image.path, s3Url));
    }
  }

  fs.writeFileSync(mdFilePath, content);
  console.log(`Updated markdown file: ${mdFilePath}`);
}

// Find and process all markdown files
async function processAllMarkdownFiles() {
  const baseDir = path.resolve(__dirname, '..');
  const markdownFiles = glob.sync('**/*.md', {
    cwd: baseDir,
    ignore: ['node_modules/**', 'dist/**', '.next/**'],
    absolute: true
  });

  console.log(`Found ${markdownFiles.length} markdown files`);
  
  for (const mdFile of markdownFiles) {
    await processMarkdownFile(mdFile);
  }
}

// Start the process
console.log('Starting to process markdown files and upload images...');
processAllMarkdownFiles().then(() => {
  console.log('Finished processing all files');
}).catch(err => {
  console.error('Error processing files:', err);
  process.exit(1);
}); 