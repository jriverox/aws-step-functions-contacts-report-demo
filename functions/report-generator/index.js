require('dotenv').config();
const AWS = require('aws-sdk');
const { Parser } = require('json2csv');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: process.env.AWS_REGION });

const s3 = new AWS.S3();

function validateInput(event) {
  return event.data && Array.isArray(event.data);
}

function createCsvFromData(data) {
  const fields = ['_id', 'index', 'name'];
  const opts = { fields };
  const parser = new Parser(opts);
  const csvContent = parser.parse(data);
  return csvContent;
}
async function uploadFileToS3(bucket, filename, csvContent) {
  const params = {
    Body: csvContent, 
    Bucket: bucket, 
    Key: filename
   };

   const response = await s3.putObject(params).promise();
   return response;
}

function createS3SignedUrlFromCsv(bucket, filename, expirationSeconds) {
  const params = {
    Bucket: bucket,
    Key: filename,
    Expires: expirationSeconds,
  };
  
  const url = s3.getSignedUrl('getObject', params);
  return url;
}
/**
 * Sample Lambda function which mocks the operation of buying a random number of shares for a stock.
 * For demonstration purposes, this Lambda function does not actually perform any  actual transactions. It simply returns a mocked result.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing details of the stock buying transaction
 * 
 */
exports.handler = async (event, context) => {
  try {
    if (!validateInput(event)) {
      throw new Error('event.data required');
    }
    const { data } = event;
    
    if (data.legth === 0) {
      return {
        statusCode: 204, //No content
        subject: 'Contacts Report / No Content',
        message: 'There is no data with the requested parameters'
      }
    }

    const csvContent = createCsvFromData(data);
    console.log('csvContent:', csvContent);
    
    const bucket = process.env.S3_BUCKET;
    const filename = `${uuidv4()}.csv`;

    const uploadResponse = await uploadFileToS3(bucket, filename, csvContent);
    console.log('uploadResponse:', uploadResponse);

    const expirationSeconds = parseInt(process.env.S3_EXPIRATION_SECONDS);
    const url = createS3SignedUrlFromCsv(bucket, filename, expirationSeconds);
    console.log('url:', url);
    return {
      statusCode: 200,
      subject: 'Contacts Report',
      message: `To download the contacts report please use the folowing link \n ${url}`
    }

  } catch (err) {
    console.error(err);
    throw err;
  }
};
