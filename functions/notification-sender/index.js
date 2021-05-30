const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({ region: process.env.REGION });

const sns = new AWS.SNS({ apiVersion: '2010-03-31', region: process.env.REGION});

function validateInput(event) {
  return event && event.subject && event.subject.length > 0 && event.message && event.message.length > 0; 
}

async function sendNotificationToSns(message, subject) {
  const params = {
    Message: message,
    Subject: subject,
    TopicArn: process.env.SNS_TOPIC
  };
  return sns.publish(params).promise();
}


/**
 * Sample Lambda function which mocks the operation of selling a random number of shares for a stock.
 * For demonstration purposes, this Lambda function does not actually perform any  actual transactions. It simply returns a mocked result.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing details of the stock selling transaction
 * 
 */
exports.handler = async (event, context) => {
  try {
    if (!validateInput(event)) {
      throw new Error('Bad Request, message and subject are required.');
    }
    const response = await sendNotificationToSns(event.message, event.subject);
    console.log('publish response:', response);
    return {
      statusCode: 202,
      message: event.message
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};
