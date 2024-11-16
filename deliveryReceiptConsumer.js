const amqp = require('amqplib');
const CommunicationsLog = require('./models/CommunicationsLog');
const Campaign = require('./models/Campaign'); 
const mongoose = require('mongoose');
require('dotenv').config();

const BATCH_SIZE = 10;  
const BATCH_TIME_INTERVAL = 1000; 
let messageBatch = [];
let isProcessing = false;  // Flag to indicate if the batch is currently being processed

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected in customerConsumer');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);  
    }
};


async function processBatch() {
  // If another process is already handling the batch, then return
  if (isProcessing || messageBatch.length === 0) {
    return;
  }

  isProcessing = true;  // Process Lock

  const campaignId = messageBatch[0].campaignId;  // Retrieving campaignId from the first message in the batch
  const sentCount = messageBatch.filter(msg => msg.deliveryStatus === 'SENT').length;  // Count SENT statuses

  try {
    // Update the campaign's messagesSent count
    await Campaign.updateOne(
      { _id: campaignId },
      { $inc: { messagesSent: sentCount } }  // Increment messagesSent by the SENT count in the batch
    );
    console.log(`Campaign ${campaignId} updated: ${sentCount} messagesSent`);

    // Perform the batch update for communicationsLog
    const bulkOps = messageBatch.map(({ communicationLogId, deliveryStatus }) => ({
      updateOne: {
        filter: { _id: communicationLogId },
        update: { $set: { deliveryStatus } }
      }
    }));

    await CommunicationsLog.bulkWrite(bulkOps);
    console.log('Batch update successful');

  } catch (error) {
    console.error('Error in batch update:', error);
  } finally {
    // Flush the batch after processing and release the lock
    messageBatch = [];
    isProcessing = false;
  }
}

// Function to listen for messages from RabbitMQ and add them to the batch
async function consumeQueue(queue) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    console.log('Waiting for messages in deliveryReceiptQueue...');

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        messageBatch.push(message);
        console.log('Received message:', message);

        // If batch size is reached, process it
        if (messageBatch.length >= BATCH_SIZE) {
          processBatch();
        }

        // Acknowledge the message
        channel.ack(msg);
      }
    });

    // Process any remaining batch periodically
    setInterval(processBatch, BATCH_TIME_INTERVAL);
  } catch (error) {
    console.error('Error in consumer:', error);
  }
}

connectDB().then(() => {
    consumeQueue('deliveryReceiptQueue');
});