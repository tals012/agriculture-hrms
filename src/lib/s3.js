const AWS = require("aws-sdk");

// Initialize S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "eu-central-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME || "agriculture-hrms-development";

/**
 * Uploads a file to S3 and returns the URL
 * @param {string|Buffer} content - The content to upload
 * @param {string} key - The S3 key (path) where the file will be stored
 * @param {string} contentType - The content type of the file
 * @returns {Promise<string>} The S3 URL of the uploaded file
 */
async function uploadToS3(content, key, contentType) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    };

    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Creates a signed URL for a file in S3
 * @param {string} key - The S3 key (path) of the file
 * @param {number} expiresIn - Time in seconds until the URL expires (default: 3600)
 * @returns {Promise<string>} The signed URL
 */
async function getSignedUrl(key, expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    throw error;
  }
}

/**
 * Creates a signed URL for uploading a file to S3
 * @param {string} key - The S3 key (path) where the file will be stored
 * @param {string} contentType - The content type of the file
 * @param {number} expiresIn - Time in seconds until the URL expires (default: 3600)
 * @returns {Promise<string>} The signed upload URL
 */
async function createSignedUploadUrl(key, contentType = "application/octet-stream", expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
      ContentType: contentType,
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    return url;
  } catch (error) {
    console.error("Error creating signed upload URL:", error);
    throw error;
  }
}

module.exports = {
  uploadToS3,
  getSignedUrl,
  createSignedUploadUrl,
}; 