const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
let env = process.env;
let envPath = fs.existsSync(path.resolve(__dirname, '.env')) ? '.env' : '../.env';
require('dotenv').config({ path: envPath});

if(!env.AWS_REGION || !env.BUCKET_NAME || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
  console.error("Please set the AWS_REGION, BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.");
  process.exit(1);
}

// Configure your AWS details
const s3Client = new S3Client({
  region: env.AWS_REGION, // e.g., 'us-east-1'
});

const bucketName = env.BUCKET_NAME;
const localDir = '../apps/dfda-1/public/app/public'; // Local directory to upload

// Function to upload a file to S3
async function uploadFile(filePath, fileKey) {
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  try {
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
    console.log(`Uploaded ${fileKey} successfully.`);
  } catch (err) {
    console.error("Error uploading file:", err);
  }
}

// Function to recursively read a directory and upload its contents
function uploadDirectory(directoryPath, s3PathPrefix = '') {
  fs.readdir(directoryPath, { withFileTypes: true }, (err, items) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    items.forEach(item => {
      const localPath = path.join(directoryPath, item.name);
      // Ensure S3 key uses forward slashes, regardless of the operating system
      const s3Key = (path.join(s3PathPrefix, item.name)).replace(/\\/g, '/');


      if (item.isDirectory()) {
        uploadDirectory(localPath, s3Key); // Recursively upload directories
      } else {
        uploadFile(localPath, s3Key); // Upload files
      }
    });
  });
}

// Start the upload process
uploadDirectory(localDir);
