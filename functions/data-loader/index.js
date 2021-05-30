const { MongoClient } = require('mongodb');
require('dotenv').config();

let cachedDb;

async function initConnection(cachedDb, url, dbName) {
  const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true };
  if (!cachedDb) {
      const client = new MongoClient(url, mongoOptions);
      await client.connect();
      cachedDb = client.db(dbName);
      console.log('db connection opened');
  }
  return cachedDb;
}

async function findContacts(db, filter) {
  const options = { 
    projection : {
      index: 1,
      // age: 1,
      // eyeColor: 1,
      name: 1,
      // gender: 1,
      // company: 1,
      // country: 1,
      // email: 1,
    }
  };
  const docs = await db.collection('people').find(filter, options).toArray();
  return docs;
}

/**
 * Sample Lambda function which mocks the operation of checking the current price of a stock.
 * For demonstration purposes this Lambda function simply returns a random integer between 0 and 100 as the stock price.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing the current price of the stock
 * 
 */
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const db = await initConnection(cachedDb, process.env.MONGODB_URL, 'contacts')
    const filter = {
      country:  event.country,
      gender: event.gender,
      eyeColor: event.eyeColor
    };
    const docs = await findContacts(db, filter);
    console.log(`returned documents: ${docs.length}`);
    if (docs.length === 0) {
      return { 
        statusCode: 204, 
        rows: 0
      };
    }
    return { 
      statusCode: 200, 
      rows: docs.length, 
      data: docs 
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};
