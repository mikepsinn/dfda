const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
let env = process.env;
let envPath = fs.existsSync(path.resolve(__dirname, '.env')) ? '.env' : '../.env';
require('dotenv').config({ path: envPath});

if(!env.AWS_REGION || !env.AWS_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
  console.error("Please set the AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.");
  process.exit(1);
}

// Configure your AWS details
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = env.AWS_BUCKET;
const localDir = '../public/img'; // Local directory to upload
const s3BaseUrl = `https://${bucketName}.s3.${env.AWS_REGION}.amazonaws.com`;

// Track files for reporting
const report = {
  uploaded: [],
  existing: [],
  errors: []
};

// Function to check if file exists in S3
async function fileExists(fileKey) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: fileKey
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
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  
  try {
    // Check if file already exists
    const exists = await fileExists(fileKey);
    if (exists) {
      report.existing.push({
        file: fileKey,
        url: `${s3BaseUrl}/${fileKey}`
      });
      console.log(`File ${fileKey} already exists, skipping.`);
      return;
    }

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
    report.uploaded.push({
      file: fileKey,
      url: `${s3BaseUrl}/${fileKey}`
    });
    console.log(`Uploaded ${fileKey} successfully.`);
  } catch (err) {
    report.errors.push({
      file: fileKey,
      error: err.message
    });
    console.error(`Error uploading ${fileKey}:`, err);
  }
}

// Function to recursively read a directory and upload its contents
async function uploadDirectory(directoryPath, s3PathPrefix = '') {
  try {
    const items = fs.readdirSync(directoryPath, { withFileTypes: true });
    
    for (const item of items) {
      const localPath = path.join(directoryPath, item.name);
      // Ensure S3 key uses forward slashes, regardless of the operating system
      const s3Key = path.join(s3PathPrefix, item.name).replace(/\\/g, '/');

      if (item.isDirectory()) {
        await uploadDirectory(localPath, s3Key); // Recursively upload directories
      } else {
        await uploadFile(localPath, s3Key); // Upload files
      }
    }
  } catch (err) {
    console.error("Error reading directory:", err);
  }
}

// Start the upload process and generate report
async function main() {
  console.log('Starting upload process...');
  await uploadDirectory(localDir);
  
  // Generate report
  console.log('\n=== Upload Report ===');
  console.log('\nUploaded Files:');
  report.uploaded.forEach(item => {
    console.log(`- ${item.file}\n  URL: ${item.url}`);
  });
  
  console.log('\nExisting Files (Skipped):');
  report.existing.forEach(item => {
    console.log(`- ${item.file}\n  URL: ${item.url}`);
  });
  
  if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach(item => {
      console.log(`- ${item.file}: ${item.error}`);
    });
  }
  
  console.log('\nSummary:');
  console.log(`Total files uploaded: ${report.uploaded.length}`);
  console.log(`Total files skipped (already exist): ${report.existing.length}`);
  console.log(`Total errors: ${report.errors.length}`);
}

main().catch(console.error);
