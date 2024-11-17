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
  if (isProcessing || messageBatch.length === 0) {
    return;
  }

  isProcessing = true;

  const session = await mongoose.startSession();
  session.startTransaction();  // Start transaction

  try {
    const campaignId = messageBatch[0].campaignId;
    const sentCount = messageBatch.filter(msg => msg.deliveryStatus === 'SENT').length;

    // Update communications logs
    const bulkOps = messageBatch.map(({ communicationLogId, deliveryStatus }) => ({
      updateOne: {
        filter: { _id: communicationLogId },
        update: { $set: { deliveryStatus } }
      }
    }));

    await CommunicationsLog.bulkWrite(bulkOps, { session });
    console.log('Batch log update successful');

    // Update the campaign messagesSent count
    await Campaign.updateOne(
      { _id: campaignId },
      { $inc: { messagesSent: sentCount } },
      { session }
    );
    console.log(`Campaign ${campaignId} updated: ${sentCount} messagesSent`);

    // Commit the transaction after both updates are successful
    await session.commitTransaction();
  } catch (error) {
    // Rollback transaction on failure
    await session.abortTransaction();
    console.error('Error in batch processing or transaction:', error);
  } finally {
    session.endSession();
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
