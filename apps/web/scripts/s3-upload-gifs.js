const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET: process.env.AWS_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_DIRECTORY: process.env.AWS_S3_DIRECTORY
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
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
const localDir = path.resolve(__dirname, '../public'); // Path to public directory
//const s3VideoPrefix = `${requiredEnvVars.AWS_S3_DIRECTORY}/video/`; // Video folder prefix in S3
const s3VideoPrefix = `video/`; // Video folder prefix in S3

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

// Function to upload a file to S3
async function uploadFile(filePath, fileKey) {
  try {
    // Check if file already exists in S3
    const exists = await checkFileExists(fileKey);
    if (exists) {
      console.log(`File ${fileKey} already exists in S3, skipping...`);
      return;
    }

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    const fileStream = fs.createReadStream(filePath);
    
    const uploadParams = {
      Bucket: bucketName,
      Key: fileKey,
      Body: fileStream,
      ContentType: contentType,
    };

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await parallelUploads3.done();
    console.log(`Successfully uploaded ${fileKey}`);
  } catch (err) {
    console.error(`Error uploading ${fileKey}:`, err);
  }
}

// Function to recursively find and upload GIF files
async function findAndUploadGifs(directoryPath) {
  try {
    const items = fs.readdirSync(directoryPath, { withFileTypes: true });

    for (const item of items) {
      const localPath = path.join(directoryPath, item.name);

      if (item.isDirectory()) {
        await findAndUploadGifs(localPath);
      } else if (path.extname(item.name).toLowerCase() === '.gif') {
        // For GIF files, create S3 key in video folder using just the filename
        const s3Key = `${s3VideoPrefix}${item.name}`;
        await uploadFile(localPath, s3Key);
      }
    }
  } catch (err) {
    console.error("Error processing directory:", err);
  }
}

// Start the upload process
console.log(`Searching for GIF files in ${localDir}`);
console.log(`Will upload to S3 bucket: ${bucketName} under prefix: ${s3VideoPrefix}`);
findAndUploadGifs(localDir);
